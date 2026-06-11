# Codex Runbook: Sprint 1 Backend

Use this runbook in the user's Codex/dev environment, where npm package installation and Docker are available.

## Goal

Validate and continue the Sprint 1 backend scaffold:

```text
auth/session
-> consent accept/revoke/list
-> skin profile save/read with consent gate
-> Turkey market seed
```

## Setup Commands

```bash
cd backend
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run build
npm test
```

If `npm install` fails, capture the full error and do not rewrite the stack. The intended MVP stack is NestJS + TypeScript + Prisma + PostgreSQL.

## Manual API Smoke Test

Start the API:

```bash
npm run start:dev
```

Health:

```bash
curl http://localhost:3000/api/v1/health
```

Create local mock session:

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/session \
  -H 'content-type: application/json' \
  -d '{"idToken":"local-user-1"}'
```

Save the returned `accessToken`, then test consent and skin profile:

```bash
TOKEN="paste-token-here"

curl -s http://localhost:3000/api/v1/me/consents \
  -H "authorization: Bearer $TOKEN"

curl -s -X POST http://localhost:3000/api/v1/me/consents \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{
    "consentType":"skin_profile_processing",
    "consentVersion":"2026-06-08-v1",
    "status":"accepted",
    "locale":"tr-TR",
    "marketCode":"TR"
  }'

curl -s -X PUT http://localhost:3000/api/v1/me/skin-profile \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d @test/fixtures/skin-profile.valid.json

curl -s http://localhost:3000/api/v1/me/skin-profile \
  -H "authorization: Bearer $TOKEN"
```

## Required Checks

- `npm run build` passes.
- `npm test` passes or failures are specific and fixable.
- `/api/v1/health` returns the standard envelope.
- `POST /auth/session` works with mock auth only when `ALLOW_MOCK_AUTH=true`.
- `/me/*` routes reject missing bearer token.
- `PUT /me/skin-profile` fails before `skin_profile_processing` consent is accepted.
- `PUT /me/skin-profile` succeeds after consent.
- Validation errors use the standard error envelope and include a request ID.

## Guardrails

- Do not add recommendation scoring in Sprint 1.
- Do not add product history, reviews, OCR, or admin workflows in Sprint 1.
- Do not log sensitive profile request bodies.
- Do not remove `product_global` / `product_market` placeholders; they prevent catalog rewrites later.
- Keep Firebase Auth behind the adapter boundary. Mock auth is dev-only.
