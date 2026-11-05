"""Cache em Redis com fallback em memória (útil em desenvolvimento sem Redis)."""
import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager
from typing import Any, Awaitable, Callable

import redis.asyncio as redis

from .config import settings

log = logging.getLogger('musify.cache')


class Cache:
    def __init__(self, url: str) -> None:
        self._redis = redis.from_url(url, decode_responses=True, socket_connect_timeout=1)
        self._mem: dict[str, tuple[float, str]] = {}
        self._local_locks: dict[str, asyncio.Lock] = {}
        self.redis_ok = True

    async def ping(self) -> bool:
        try:
            await self._redis.ping()
            self.redis_ok = True
        except Exception:
            self.redis_ok = False
        return self.redis_ok

    async def close(self) -> None:
        try:
            await self._redis.aclose()
        except Exception:
            pass

    def _mem_get(self, key: str) -> str | None:
        item = self._mem.get(key)
        if not item:
            return None
        if item[0] < time.time():
            self._mem.pop(key, None)
            return None
        return item[1]

    async def get(self, key: str) -> Any | None:
        raw: str | None = None
        try:
            raw = await self._redis.get(key)
            self.redis_ok = True
        except Exception:
            self.redis_ok = False
            raw = self._mem_get(key)
        return json.loads(raw) if raw else None

    async def set(self, key: str, value: Any, ttl: int) -> None:
        raw = json.dumps(value, ensure_ascii=False)
        try:
            await self._redis.set(key, raw, ex=max(1, int(ttl)))
            self.redis_ok = True
        except Exception:
            self.redis_ok = False
            self._mem[key] = (time.time() + ttl, raw)

    async def delete(self, key: str) -> None:
        self._mem.pop(key, None)
        try:
            await self._redis.delete(key)
        except Exception:
            pass

    async def incr_window(self, key: str, window: int) -> int:
        try:
            n = await self._redis.incr(key)
            if n == 1:
                await self._redis.expire(key, window)
            return int(n)
        except Exception:
            raw = self._mem_get(key)
            n = int(raw or 0) + 1
            self._mem[key] = (time.time() + window, str(n))
            return n

    @asynccontextmanager
    async def lock(self, key: str, ttl: int = 20, wait: float = 10.0):
        """Lock anti-stampede: asyncio local + SET NX no Redis (melhor esforço)."""
        local = self._local_locks.setdefault(key, asyncio.Lock())
        async with local:
            acquired = False
            deadline = time.time() + wait
            lock_key = f'lock:{key}'
            while time.time() < deadline:
                try:
                    acquired = bool(await self._redis.set(lock_key, '1', nx=True, ex=ttl))
                except Exception:
                    acquired = True  # sem Redis: o lock local basta
                if acquired:
                    break
                await asyncio.sleep(0.15)
            try:
                yield
            finally:
                if acquired:
                    try:
                        await self._redis.delete(lock_key)
                    except Exception:
                        pass

    async def get_or_set(
        self, key: str, ttl: int, loader: Callable[[], Awaitable[Any]]
    ) -> tuple[Any, bool]:
        """Devolve (valor, hit). Só um pedido carrega cada chave de cada vez."""
        cached = await self.get(key)
        if cached is not None:
            return cached, True
        async with self.lock(f'load:{key}'):
            cached = await self.get(key)
            if cached is not None:
                return cached, True
            value = await loader()
            await self.set(key, value, ttl)
            return value, False


cache = Cache(settings.redis_url)
