# SkinMatch

Turkey-first skincare intelligence monorepo.

## Repo Layout

```text
skinmatch-backend/
  skinmatch-backend/  # NestJS backend
  android-app/        # Android MVP app shell
```

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
cd skinmatch-backend
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run start:dev
```

Catalog ops admin routes require `ADMIN_API_KEY`; local development defaults to
`skinmatch-local-admin` outside production. The lightweight panel is available
at `http://localhost:3000/api/v1/admin/catalog/panel` when the backend is
running.

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

On Windows, if PostgreSQL is installed but Docker is not available, the backend
has a helper that creates a dedicated local dev cluster under AppData and starts
it on port `55432`:

```powershell
cd skinmatch-backend
.\scripts\start-local-postgres.ps1
```

Then set this in `skinmatch-backend/.env`:

```bash
DATABASE_URL=postgresql://skincare:skincare@127.0.0.1:55432/skincare_dev?schema=public
```

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
cd skinmatch-backend
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run start:dev
```

If the `skincare` role already exists, skip the `CREATE ROLE` command. If the
database already exists with a non-UTF-8 encoding, recreate it before seeding.

## Android MVP App Shell

The Android MVP app lives in `android-app/`. It is a native Kotlin + Jetpack
Compose app using Material 3, Navigation Compose, ViewModels, Flow, and mock
repositories for product search/detail until product catalog APIs are ready.

One-command run on Windows:

```bash
cd android-app
.\run-app.cmd
```

You can also double-click `android-app/run-app.cmd`. The script finds the
Android SDK, starts the default `DockJam_API36` emulator if no device is
connected, builds the debug APK, installs it, and launches SkinMatch.

Optional manual setup if the script cannot find your SDK:

```properties
sdk.dir=C\:\\Android\\Sdk
```

Manual build:

```bash
cd android-app
./gradlew assembleDebug
```

Install on a running emulator or device:

```bash
cd android-app
./gradlew installDebug
```

MVP notes:

- Product search/detail uses mock Turkey-market fixtures.
- Skin Profile V1 fields are represented with backend-facing IDs and Turkish UI labels.
- Consent is required before writing the mock skin profile.
- Product detail shows local product status, data confidence, raw ingredients, and normalized ingredient mappings.
- The app does not calculate recommendation scores locally.
- Backend dependencies still pending: product catalog search/detail DTOs, local verification status, ingredient normalization confidence, and future recommendation service output.
