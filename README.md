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
npm run prisma:validate
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

## Local PostgreSQL Without Docker

If Docker is not available, run PostgreSQL locally and keep the development
database UTF-8 encoded so Turkey seed data stores correctly.

Create the local role and database:

```bash
psql -h localhost -U postgres -d postgres -c "CREATE ROLE skincare LOGIN PASSWORD 'skincare';"
createdb -h localhost -U postgres -O skincare -E UTF8 --locale=C --template=template0 skincare_dev
```

Then set this in `.env`:

```bash
DATABASE_URL=postgresql://skincare:skincare@localhost:5432/skincare_dev?schema=public
```

Run the app setup against that database:

```bash
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run start:dev
```

If the `skincare` role already exists, skip the `CREATE ROLE` command. If the
database already exists with a non-UTF-8 encoding, recreate it before seeding.
