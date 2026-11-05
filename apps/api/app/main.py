import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .cache import cache
from .config import settings
from .routers import meta, stream

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not await cache.ping():
        logging.getLogger('musify').warning('Redis indisponível, a usar cache em memória.')
    yield
    await stream.client.aclose()
    await cache.close()


app = FastAPI(title='Musify API', version='1.0.0', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_methods=['GET', 'POST'],
    allow_headers=['*'],
    expose_headers=['X-Cache', 'Content-Range', 'Accept-Ranges'],
)


@app.middleware('http')
async def rate_limit(request: Request, call_next):
    path = request.url.path
    if path.startswith('/api/') and path != '/api/health':
        ip = request.client.host if request.client else 'unknown'
        window = int(__import__('time').time() // 60)
        count = await cache.incr_window(f'rl:{ip}:{window}', 60)
        if count > settings.rate_limit_per_min:
            return JSONResponse({'error': 'rate_limited', 'code': 'TOO_MANY_REQUESTS'}, status_code=429)
    return await call_next(request)


@app.get('/api/health')
async def health():
    redis_ok = await cache.ping()
    return {'status': 'ok', 'redis': 'ok' if redis_ok else 'down'}


app.include_router(meta.router, prefix='/api')
app.include_router(stream.router, prefix='/api')
