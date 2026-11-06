# Musify

Cliente de música com providers de descoberta e reprodução: YouTube como fonte prioritária para pesquisa e descoberta, Audius como alternativa e áudio local gerido no browser.

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + Zustand + TanStack Query |
| Backend | FastAPI (Python) + YouTube Data API/OAuth + Audius API |
| Reprodução YouTube | Player oficial incorporado do YouTube |
| Reprodução Audius | Endpoint oficial de stream Audius, com verificação de disponibilidade e restrições |
| Reprodução local | Ficheiros escolhidos pelo utilizador e reproduzidos no browser; nunca enviados para o backend |
| Cache | Redis com fallback em memória |

## Arquitetura de providers

- **YouTube:** provider prioritário para pesquisa e descoberta. A pesquisa usa a YouTube Data API v3; quando a conta está ligada, as recomendações usam os artistas e vídeos da playlist de gostos como sinais para procurar música relacionada.
- **Audius:** provider de fallback quando o YouTube não devolve resultados ou a API está temporariamente indisponível. A reprodução continua sujeita às verificações de disponibilidade e acesso.
- **Áudio local:** permanece no dispositivo do utilizador e não é enviado para o backend.

O Musify não acede ao algoritmo privado de recomendações da página inicial do YouTube. As recomendações personalizadas são uma descoberta própria baseada nos dados autorizados pelo utilizador. O servidor não extrai áudio do YouTube; as faixas YouTube são reproduzidas pelo player oficial incorporado.

## Configuração

Cria o arquivo apps/api/.env com as credenciais:

~~~env
YOUTUBE_API_KEY=
YOUTUBE_REGION_CODE=AO
AUDIUS_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/youtube/callback
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379/0
~~~

O backend lê esse arquivo quando iniciado a partir de apps/api, e o Docker Compose também o carrega para o container da API. Não coloques segredos no repositório.

### Autorizar o callback OAuth no Google

O callback precisa estar registado exatamente no cliente OAuth usado pelo backend. Para desenvolvimento local:

~~~text
http://localhost:8000/api/auth/youtube/callback
~~~

1. Abre o Google Cloud Console e seleciona o projeto correspondente ao GOOGLE_CLIENT_ID.
2. Vai a **APIs e serviços → Credenciais** e abre o ID de cliente OAuth 2.0. O tipo deve ser **Aplicativo da Web**.
3. Em **URIs de redirecionamento autorizados**, adiciona exatamente o URI acima.
4. Confirma que GOOGLE_REDIRECT_URI em apps/api/.env contém o mesmo valor.
5. Reinicia a API e tenta **Conectar com YouTube** novamente.

## Executar

Backend:

~~~bash
cd apps/api
python -m venv .venv
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
~~~

Frontend:

~~~bash
cd apps/web
npm install
npm run dev
~~~

## Endpoints principais

| Método | Endpoint | Descrição |
|---|---|---|
| GET | /api/health | Estado da API e do Redis |
| GET | /api/music/search?q= | Pesquisa YouTube primeiro; Audius como fallback |
| GET | /api/music/trending | Descoberta regional YouTube; Audius como fallback |
| GET | /api/music/recommendations | Recomendações baseadas nos gostos da conta ligada; público quando não há sessão |
| GET | /api/music/tracks/{id} | Metadados de uma faixa Audius |
| GET | /api/music/tracks/{id}/stream | Verifica acesso e redireciona para o stream oficial Audius |
| GET | /api/home | Conteúdo inicial legado |
| GET | /api/moods, /api/moods/{key} | Playlists por disposição |
| GET | /api/playlist/{id} | Playlist YouTube |
| GET | /api/search?q= | Pesquisa YouTube de catálogo completo |
| GET/POST | /api/auth/youtube/* | Autenticação YouTube |

## Quota e cache

A pesquisa usa search.list e os detalhes são carregados em lote com videos.list. As respostas ficam em cache para reduzir chamadas. Recomendações por conta usam uma chave de cache derivada do ID do canal, evitando servir os gostos de uma conta a outra. O limite diário e o consumo da API devem ser acompanhados no Google Cloud Console.

## Testes

~~~bash
cd apps/api
pytest -v
ruff check app tests
~~~
