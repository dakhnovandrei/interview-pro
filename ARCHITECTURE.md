# Container Architecture

## Services
- `reverse-proxy`: public Nginx entrypoint on `${APP_PORT:-80}`.
- `frontend`: React static build served by Nginx.
- `backend`: FastAPI API, WebSocket, sitemap and robots endpoints.
- `db`: PostgreSQL database with persistent `postgres_data` volume.
- `minio`: object storage for user photos with persistent `minio_data` volume.
- `ollama`: external dependency reached through `LLAMA_URL` (`host.docker.internal` by default).

## Network
All containers are attached to the private `app_net` bridge network.
Only `reverse-proxy` is public. MinIO ports are exposed for local development.

Routes:
- `/` -> `frontend:80`
- `/api/*`, `/ws/*`, `/robots.txt`, `/sitemap.xml` -> `backend:8000`
- `backend` -> `db:5432`, `minio:9000`, `${LLAMA_URL}`

## Local Run
1. Copy `.env.example` to `.env`.
2. Change `SECRET_KEY`, `POSTGRES_PASSWORD`, `ADMIN_PASSWORD`, `MINIO_SECRET_KEY`.
3. Run `docker compose up --build`.
4. Open `http://localhost`.

Healthchecks and `depends_on.condition: service_healthy` keep startup ordered.
If Ollama is unavailable, the existing app returns graceful AI error text instead of crashing.
