"""Google OAuth 2.0 connection for a user's own YouTube channel via official APIs."""
import secrets
import time
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Cookie, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from .cache import cache
from .config import settings

router = APIRouter(prefix='/auth/youtube', tags=['YouTube account'])
SCOPES = 'https://www.googleapis.com/auth/youtube.readonly'


def _configured():
    if not settings.google_client_id or not settings.google_client_secret or not settings.google_redirect_uri:
        raise HTTPException(503, detail={
            'error': 'configuration', 'code': 'GOOGLE_OAUTH_NOT_CONFIGURED',
            'message': 'Configura GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e GOOGLE_REDIRECT_URI para ligar a conta YouTube.'
        })


@router.get('/login')
async def login(request: Request):
    _configured()
    state = secrets.token_urlsafe(32)
    await cache.set(f'youtube:oauth-state:{state}', {'created': int(time.time())}, 600)
    params = {
        'client_id': settings.google_client_id,
        'redirect_uri': settings.google_redirect_uri,
        'response_type': 'code',
        'scope': SCOPES,
        'state': state,
        'access_type': 'offline',
        'prompt': 'consent',
        'include_granted_scopes': 'true',
    }
    return RedirectResponse('https://accounts.google.com/o/oauth2/v2/auth?' + urlencode(params), status_code=302)


@router.get('/callback')
async def callback(request: Request, state: str = '', code: str = '', error: str = ''):
    _configured()
    frontend = settings.frontend_url.rstrip('/')
    expected = await cache.get(f'youtube:oauth-state:{state}') if state else None
    if not expected:
        return RedirectResponse(f'{frontend}/account?youtube=state_error', status_code=303)
    await cache.delete(f'youtube:oauth-state:{state}')
    if error or not code:
        return RedirectResponse(f'{frontend}/account?youtube=cancelled', status_code=303)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            token_response = await client.post('https://oauth2.googleapis.com/token', data={
                'code': code,
                'client_id': settings.google_client_id,
                'client_secret': settings.google_client_secret,
                'redirect_uri': settings.google_redirect_uri,
                'grant_type': 'authorization_code',
            })
            token_response.raise_for_status()
            token_data = token_response.json()
            channel_response = await client.get(
                'https://www.googleapis.com/youtube/v3/channels',
                params={'part': 'snippet', 'mine': 'true'},
                headers={'Authorization': f"Bearer {token_data['access_token']}"},
            )
            channel_response.raise_for_status()
            channels = channel_response.json().get('items', [])
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        return RedirectResponse(f'{frontend}/account?youtube=exchange_error', status_code=303)
    if not channels:
        return RedirectResponse(f'{frontend}/account?youtube=no_channel', status_code=303)
    channel = channels[0]
    session_id = secrets.token_urlsafe(32)
    await cache.set(f'youtube:session:{session_id}', {
        'access_token': token_data['access_token'],
        'refresh_token': token_data.get('refresh_token'),
        'expires_at': int(time.time()) + int(token_data.get('expires_in', 3600)),
        'channel': {
            'id': channel.get('id'),
            'title': channel.get('snippet', {}).get('title'),
            'thumbnail': (channel.get('snippet', {}).get('thumbnails', {}).get('default') or {}).get('url'),
        },
    }, 30 * 24 * 3600)
    response = RedirectResponse(f'{frontend}/account?youtube=connected', status_code=303)
    response.set_cookie(
        'musify_youtube_session', session_id, max_age=30 * 24 * 3600,
        httponly=True, secure=request.url.scheme == 'https', samesite='lax', path='/',
    )
    return response


async def get_account(session_id: str | None) -> dict | None:
    if not session_id:
        return None
    session = await cache.get(f'youtube:session:{session_id}')
    if not session:
        return None
    if session.get('expires_at', 0) <= int(time.time()) + 60 and session.get('refresh_token'):
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post('https://oauth2.googleapis.com/token', data={
                    'client_id': settings.google_client_id,
                    'client_secret': settings.google_client_secret,
                    'refresh_token': session['refresh_token'],
                    'grant_type': 'refresh_token',
                })
                response.raise_for_status()
                token = response.json()
            session['access_token'] = token['access_token']
            session['expires_at'] = int(time.time()) + int(token.get('expires_in', 3600))
            await cache.set(f'youtube:session:{session_id}', session, 30 * 24 * 3600)
        except (httpx.HTTPError, KeyError, ValueError):
            return None
    return session


@router.get('/status')
async def status(musify_youtube_session: str | None = Cookie(default=None)):
    account = await get_account(musify_youtube_session)
    return {'connected': bool(account), 'channel': account.get('channel') if account else None}


@router.post('/logout')
async def logout(response: Response, musify_youtube_session: str | None = Cookie(default=None)):
    if musify_youtube_session:
        await cache.delete(f'youtube:session:{musify_youtube_session}')
    response.delete_cookie('musify_youtube_session', path='/')
    return {'connected': False}
