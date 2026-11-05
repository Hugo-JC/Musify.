import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse, StreamingResponse
from starlette.background import BackgroundTask

from ..config import settings
from ..services.stream import StreamError, get_stream_info, invalidate, is_valid_video_id

router = APIRouter()

client = httpx.AsyncClient(follow_redirects=True, timeout=httpx.Timeout(15.0, read=60.0))
PASS_HEADERS = ('content-type', 'content-length', 'content-range', 'accept-ranges')


def _check(video_id: str) -> None:
    if not is_valid_video_id(video_id):
        raise HTTPException(422, detail={'error': 'invalid_id', 'code': 'BAD_VIDEO_ID'})


async def _open_upstream(video_id: str, range_header: str, force: bool = False):
    info = await get_stream_info(video_id, force=force)
    headers = {'Range': range_header, **info.headers}
    req = client.build_request('GET', info.url, headers=headers)
    return await client.send(req, stream=True)


@router.get('/stream/{video_id}')
async def stream(video_id: str, request: Request):
    _check(video_id)
    try:
        if settings.stream_mode == 'redirect':
            info = await get_stream_info(video_id)
            return RedirectResponse(info.url, status_code=302)

        range_header = request.headers.get('range', 'bytes=0-')
        upstream = await _open_upstream(video_id, range_header)
        if upstream.status_code in (401, 403, 410):  # URL expirado ou ligado a outro IP
            await upstream.aclose()
            await invalidate(video_id)
            upstream = await _open_upstream(video_id, range_header, force=True)
    except StreamError as exc:
        return JSONResponse({'error': 'stream', 'code': 'STREAM_FAILED', 'message': str(exc)}, status_code=exc.status)
    except httpx.HTTPError as exc:
        return JSONResponse({'error': 'upstream', 'code': 'UPSTREAM_FAILED', 'message': str(exc)[:200]}, status_code=502)

    headers = {k: v for k, v in upstream.headers.items() if k.lower() in PASS_HEADERS}
    headers.setdefault('accept-ranges', 'bytes')
    return StreamingResponse(
        upstream.aiter_raw(),
        status_code=upstream.status_code,
        headers=headers,
        background=BackgroundTask(upstream.aclose),
    )


@router.post('/stream/{video_id}/warm', status_code=202)
async def warm(video_id: str):
    """Aquece a cache do URL (prefetch da faixa seguinte)."""
    _check(video_id)
    try:
        info = await get_stream_info(video_id)
    except StreamError as exc:
        return JSONResponse({'error': 'stream', 'code': 'STREAM_FAILED', 'message': str(exc)}, status_code=exc.status)
    return {'videoId': video_id, 'expiresAt': info.expires_at}
