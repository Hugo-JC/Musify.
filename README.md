# Musify

Cliente de música com uma arquitetura de providers: catálogo e reprodução Audius, mais áudio local escolhido pelo utilizador.

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Zustand + TanStack Query |
| Backend | FastAPI (Python) + Audius API + YouTube Data API/OAuth (legado durante a migração) |
| Reprodução online | Endpoint oficial de stream do Audius, com verificação de disponibilidade e restrições de acesso |
| Reprodução local | Ficheiros selecionados pelo utilizador e reproduzidos no browser; nunca enviados para o backend |
| Cache | Redis com fallback em memória |

## Arquitetura de providers

- **Audius:** pesquisa, tendências, metadados e reprodução através da API oficial. Musify valida se a faixa está disponível, se é streamable e se tem restrições de acesso antes de iniciar a reprodução.
- **Áudio local:** será gerido no frontend através da API de áudio do browser. Os ficheiros permanecem no dispositivo do utilizador.
- **YouTube:** a integração existente permanece isolada durante a migração; não é utilizada para extrair áudio nem para contornar o player oficial.

A API Audius é de leitura para pesquisa e descoberta; uma API key é opcional e pode aumentar os limites de utilização. Consulta a [documentação oficial](https://docs.audius.co/api/) antes de configurar uma chave.

## Configuração

Cria `apps/api/.env` com as credenciais do Google OAuth:

```env
YOUTUBE_API_KEY=
AUDIUS_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/youtube/callback
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379/0
```

O backend lê esse arquivo quando iniciado a partir de `apps/api`, e o Docker Compose
também o carrega para o container da API. O `.env.example` não é rastreado pelo Git;
não o uses como arquivo de configuração. No Google Cloud Console, regista o mesmo
valor de `GOOGLE_REDIRECT_URI` como URI de redirecionamento autorizado para o cliente OAuth.

### Backend

```bash
cd apps/api
python -m venv .venv
# Ativa o ambiente virtual e instala as dependências:
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

## Endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/health` | Estado da API e do Redis |
| GET | `/api/music/search?q=` | Pesquisa Audius |
| GET | `/api/music/trending` | Faixas em tendência no Audius |
| GET | `/api/music/tracks/{id}` | Metadados normalizados de uma faixa |
| GET | `/api/music/tracks/{id}/stream` | Verifica acesso e redireciona para o stream oficial Audius |
| GET | `/api/home` | Conteúdo inicial legado |
| GET | `/api/moods`, `/api/moods/{key}` | Playlists por disposição |
| GET | `/api/playlist/{id}` | Playlist YouTube legado |
| GET | `/api/search?q=` | Pesquisa YouTube legado |
| GET/POST | `/api/auth/youtube/*` | Autenticação YouTube existente |

## Testes

```bash
cd apps/api
pytest -v
ruff check app tests
```
