# Musify

Cliente de música moderno baseado no design Figma **«Musify — Desktop website»**, integrando a **API oficial do YouTube (Google Data API v3)**, leitor oficial **YouTube IFrame Player** e autenticação **Google OAuth 2.0**.

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Zustand + TanStack Query |
| Backend | FastAPI (Python) + YouTube Data API v3 + Google OAuth 2.0 |
| Reprodução | Leitor oficial incorporado YouTube IFrame Player API (em conformidade com as regras do YouTube) |
| Cache | Redis com fallback em memória |

---

## Novidades e Melhorias

- **Reprodução 100% oficial e estável:** Substituição de extração não-oficial de áudio pelo leitor oficial YouTube IFrame Player, garantindo reprodução sem bloqueios de IP ou verificação de bot.
- **API oficial do YouTube:** Metadados, pesquisas e playlists carregados via Google YouTube Data API v3 oficial (`YOUTUBE_API_KEY`).
- **Autenticação oficial do YouTube (Google OAuth 2.0):** Nova tela de conta (`/account`) que permite ao utilizador associar o seu canal verificado da Google, carregar músicas favoritas marcadas com «Gosto» e receber recomendações personalizadas.
- **Fim das playlists de demonstração:** As músicas provêm em direto da API. Caso ocorra alguma falha ou ausência de credenciais, a interface apresenta uma notificação clara com botão de recarregar/tentar novamente.
- **Tema Carmesim Escuro (Figma):** Estilo atualizado com vermelho carmesim (`#E61C34`), painéis escuros e ícones arredondados/preenchidos em toda a aplicação.

---

## Arranque rápido

### 1. Configurar variáveis de ambiente da API

Cria o ficheiro `apps/api/.env` (ou usa as variáveis do sistema):

```env
# Chave da API oficial YouTube Data API v3 (Google Cloud Console)
YOUTUBE_API_KEY=AIzaSy...

# Google OAuth 2.0 (para login de conta YouTube e recomendações)
GOOGLE_CLIENT_ID=seu-id-de-cliente.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/youtube/callback
FRONTEND_URL=http://localhost:3000

# Cache (opcional)
REDIS_URL=redis://localhost:6379/0
```

### 2. Iniciar o Backend

```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Iniciar o Frontend

```bash
cd apps/web
npm install
npm run dev
# Abre http://localhost:3000
```

---

## Endpoints da API

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/health` | Estado da API e do Redis |
| GET | `/api/home` | Atalhos e recomendações «Made For You» (personalizadas se autenticado) |
| GET | `/api/moods`, `/api/moods/{key}` | Playlists por disposição («Tune your mood») |
| GET | `/api/playlist/{id}` | Carregamento de playlist oficial |
| GET | `/api/search?q=` | Pesquisa de músicas, playlists e artistas via YouTube Data API |
| GET | `/api/auth/youtube/login` | Inicia o fluxo de autorização Google OAuth 2.0 |
| GET | `/api/auth/youtube/callback` | Callback de autorização Google e criação de sessão segura |
| GET | `/api/auth/youtube/status` | Estado da conta YouTube ligada e dados do canal |
| POST | `/api/auth/youtube/logout` | Termina a sessão da conta ligada |

---

## Validação e Testes

Todos os testes e validações foram executados com sucesso:

```bash
# Testes do backend (12 testes: endpoints, cache, normalização e auth)
cd apps/api && pytest -v

# Testes unitários do frontend (Vitest)
cd apps/web && npm test

# Validação estática de tipos TypeScript
cd apps/web && npm run typecheck

# Build de produção do Next.js
cd apps/web && npm run build
```
