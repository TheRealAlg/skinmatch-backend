# Skincare Backend

Turkey-first skincare intelligence backend.

## Sprint 1 Scope

- NestJS backend foundation.
- PostgreSQL + Prisma.
- Redis and Meilisearch local services.
- Turkey market seed.
- Auth/session skeleton.
- KVKK-aware consent APIs.
- Skin profile APIs.

## Local Setup

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run start:dev
```

Healthcheck:

```bash
curl http://localhost:3000/api/v1/health
```

## Mock Auth For Local Development

When `AUTH_PROVIDER=mock` and `ALLOW_MOCK_AUTH=true`, `POST /api/v1/auth/session` accepts any non-empty `idToken` and creates a local test user.

Do not enable mock auth in production.
