# Musify

Cliente de streaming de música baseado no design Figma **«Musify — Desktop website»**.

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + Zustand + TanStack Query |
| Backend | FastAPI (Python) com **ytmusicapi** (sigma67) e **yt-dlp** |
| Cache | Redis (com fallback em memória se não estiver disponível) |

## Arranque rápido

### Com Docker

```bash
docker compose up --build
# Web: http://localhost:3000   API: http://localhost:8000/docs
```

### Em local (3 terminais)

```bash
# 1) Redis
docker compose up redis

# 2) API
cd apps/api
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp ../../.env.example .env                           # opcional
uvicorn app.main:app --reload --port 8000

# 3) Web
cd apps/web
npm install
npm run dev                                          # http://localhost:3000
```

Sem a API a Home mostra dados de exemplo («modo demo»). Sem Redis a API usa cache em memória.

## Arquitetura

```
Browser ──> Next.js (/api/* rewrite) ──> FastAPI ──> Redis (cache)
                                            └──────> ytmusicapi (metadados) / yt-dlp (URL de áudio)
```

- **Metadados:** `GET /api/playlist/{id}` → cache Redis → ytmusicapi → schemas próprios (o frontend nunca vê a forma crua da biblioteca).
- **Stream:** `GET /api/stream/{videoId}` → URL direto do yt-dlp em cache (TTL = expiração − 2 min) → **proxy com suporte a Range** (seek funciona). `STREAM_MODE=redirect` devolve 302 em vez de proxy, mas os URLs do googlevideo costumam estar ligados ao IP do servidor.
- **Prefetch:** a meio da faixa, o frontend chama `POST /api/stream/{nextId}/warm` para a troca ser instantânea.

### Endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/health` | Estado da API e do Redis |
| GET | `/api/home` | Atalhos e «Made For You» |
| GET | `/api/moods`, `/api/moods/{focus\|unwind\|energy}` | «Tune your mood» |
| GET | `/api/playlist/{id}` | Playlist (ou álbum `MPRE…`) com faixas |
| GET | `/api/search?q=` | Faixas, playlists, álbuns e artistas |
| GET | `/api/stream/{videoId}` | Áudio (proxy com Range ou redirect) |
| POST | `/api/stream/{videoId}/warm` | Aquece a cache do URL |

## Estrutura

```
apps/
├─ api/   app/{main,config,cache,schemas}.py · routers/{meta,stream}.py · services/{ytm,stream}.py · tests/
└─ web/   src/app (rotas) · components/{layout,player,home,ui} · stores (usePlayer, useLibrary) · lib · types
```

## Funcionalidades

- Layout fiel ao frame do Figma: header, barra lateral com biblioteca, Home («Good morning», filtros, «Tune your mood», atalhos 3×2, «Made For You») e barra de reprodução.
- Player global (um só `<audio>`): fila, shuffle, repeat (off/all/one), seek, volume, Media Session e atalhos (`Espaço`, `←/→` ±5 s, `Shift+←/→` anterior/seguinte, `M` mute).
- Pesquisa, página de playlist/álbum e favoritos guardados em `localStorage`.

## Testes

```bash
cd apps/api && pytest          # cache, validação de videoId, TTL, normalização
cd apps/web && npm test        # store do player e formatação
cd apps/web && npm run typecheck && npm run build
```

## Notas sobre o design (importante)

Este projeto foi gerado quando o limite de chamadas do MCP do Figma (plano Starter) já tinha sido atingido, por isso **não foi possível extrair o código de referência, os tokens e os assets do frame**. Foi construído a partir do screenshot e das medidas do frame (header 80 px, barra lateral 288 px, barra de reprodução 112 px, cartões 352×76 e 352×356). Consequências:

- **Cores e tipografia estimadas** em `apps/web/src/app/globals.css` (variáveis CSS). Para os valores exatos, correr `get_variable_defs` / `get_design_context` no frame `105:8` quando o limite for reposto e atualizar essas variáveis.
- **Ícones:** `lucide-react` em vez dos ícones Iconify do ficheiro (funciona offline e sem pedidos externos).
- **Imagens:** as capas vêm da API; quando não existem, aparece um gradiente com iniciais. Os avatares e capas do Figma não foram incluídos.
- **Fonte:** Inter (`@fontsource-variable/inter`).

## Aviso legal

Usar yt-dlp para reproduzir áudio do YouTube vai contra os termos de serviço do YouTube. Este projeto destina-se a uso pessoal e demonstração (portfólio). Não o disponibilizes publicamente como serviço. Convém manter o yt-dlp atualizado (`pip install -U yt-dlp`), pois o YouTube altera frequentemente a extração.

## Próximos passos

Responsivo abaixo de 1024 px, biblioteca em SQLite/Postgres, autenticação do ytmusicapi (OAuth) para recomendações reais, CI (GitHub Actions) e testes e2e com Playwright.
