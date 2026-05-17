# Project Work Summary

## Implemented Areas

### SEO
- Public indexable pages: `/`, `/interview-templates`.
- Private/non-indexable pages: `/home`, `/profile`, `/interview/:sessionId`, `/templates`, `/templates/create`, `/admin`, `/login`.
- Dynamic metadata is handled by `Seo.tsx`: title, description, robots, canonical, Open Graph, Twitter card and JSON-LD.
- Backend exposes:
  - `/sitemap.xml`
  - `/robots.txt`
- Public structured data is added on landing/templates pages.

### External API
- Existing Ollama integration is used as the external API.
- `LLamaInterviewAI` handles calls to `LLAMA_URL`.
- On Ollama failure, the service returns a graceful error string instead of crashing the app.

### Tests
- Backend tests are in `Fullstack/tests/test_backend_minimal.py`.
- Frontend tests are in `Frontend_for_Fullstack/my_app/src/__tests__/app-minimal.test.tsx`.
- E2E test is in `Frontend_for_Fullstack/my_app/e2e/business.spec.ts`.
- Coverage thresholds are configured in:
  - `Fullstack/pytest.ini`
  - `Frontend_for_Fullstack/my_app/vitest.config.ts`

### Containerization
- `docker-compose.yml` starts:
  - `reverse-proxy`
  - `frontend`
  - `backend`
  - `db`
  - `minio`
- Reverse proxy config: `infra/nginx/default.conf`.
- Backend Dockerfile: `Fullstack/Dockerfile`.
- Frontend Dockerfile: `Frontend_for_Fullstack/my_app/Dockerfile`.
- Runtime configuration is based on `.env` copied from `.env.example`.

### CI/CD
- GitHub Actions workflow: `.github/workflows/ci-cd.yml`.
- Pipeline runs backend tests, frontend tests, frontend build, Docker image builds and a deploy hook placeholder.

## Local Run Without Docker

### Backend
```bash
cd Fullstack
.venv\Scripts\python.exe -m uvicorn src.main:app --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd Frontend_for_Fullstack/my_app
npm install
npm run dev
```

Frontend opens at `http://localhost:5173`.

## Docker Run

1. Copy `.env.example` to `.env`.
2. Replace all `change-me` values.
3. Start:

```bash
docker compose --env-file .env up -d --build
```

Open `http://localhost`.

Stop:

```bash
docker compose --env-file .env down
```

## Checks

### Backend
```bash
cd Fullstack
.venv\Scripts\python.exe -m pytest
```

### Frontend
```bash
cd Frontend_for_Fullstack/my_app
npm run test
npm run build
```

### E2E
```bash
cd Frontend_for_Fullstack/my_app
npm run test:e2e
```

### Docker Config
```bash
docker compose --env-file .env.example config
```

## Important URLs
- App: `http://localhost`
- Backend API via proxy: `http://localhost/api/...`
- WebSocket via proxy: `ws://localhost/ws/v1/interview/{sessionId}`
- Sitemap: `http://localhost/sitemap.xml`
- Robots: `http://localhost/robots.txt`
- MinIO console: `http://localhost:9001`
