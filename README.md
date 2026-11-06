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
não o uses como arquivo de configuração.

### Autorizar o callback OAuth no Google

O Google exige que o callback enviado pela API seja registado exatamente no cliente
OAuth usado pelo backend. Para desenvolvimento local, o valor é:

```text
http://localhost:8000/api/auth/youtube/callback
```

1. Abre o [Google Cloud Console](https://console.cloud.google.com/) e seleciona o
   projeto correspondente ao `GOOGLE_CLIENT_ID` configurado em `apps/api/.env`.
2. Vai a **APIs e serviços → Credenciais** e abre o ID de cliente OAuth 2.0 usado
   pelo backend. O tipo da aplicação deve ser **Aplicativo da Web**.
3. Em **URIs de redirecionamento autorizados**, adiciona exatamente
   `http://localhost:8000/api/auth/youtube/callback` e guarda.
   Não o adiciones apenas em **Origens JavaScript autorizadas**.
4. Confirma que `GOOGLE_REDIRECT_URI` em `apps/api/.env` contém esse mesmo URI,
   sem espaços nem barra final extra. `localhost` e `127.0.0.1`, HTTP e HTTPS,
   portas e caminhos diferentes não são equivalentes.
5. Reinicia a API para ela carregar o `.env` atualizado. Se usas Docker Compose,
   executa `docker compose up -d --force-recreate api` na raiz do projeto.
6. Abre a aplicação em `http://localhost:3000` e tenta **Conectar com YouTube**
   novamente. Se ainda falhar, compara o `redirect_uri` mostrado nos detalhes do
   erro Google com a lista de URIs autorizados do mesmo ID de cliente OAuth.

O URI exibido no erro `redirect_uri_mismatch` é o que a API realmente enviou.
Se estiveres a usar outro domínio/porta ou HTTPS, configura o URI público completo
em `GOOGLE_REDIRECT_URI` e regista exatamente o mesmo valor no cliente OAuth.

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
