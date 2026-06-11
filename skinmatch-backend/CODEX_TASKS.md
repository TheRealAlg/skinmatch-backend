# Codex Task Queue

Use these tasks sequentially. Each task should end with:

- Files changed.
- Commands run.
- Test/build/lint result.
- Assumptions.
- Follow-up task recommendation.

## Task 0: Inspect Repo

Inspect the repository against `AGENTS.md`, `CODEX_RUNBOOK.md`, and Sprint 1 requirements. Do not implement unless required to make the repo runnable. Report current structure, risks, and the first safe implementation task.

Acceptance criteria:

- Repo structure summarized.
- Missing setup identified.
- No unrelated changes.

## Task 1: Validate Scaffold

Install dependencies, generate Prisma client, run build, and run tests.

Commands:

```bash
npm install
npm run prisma:generate
npm run build
npm test
```

Acceptance criteria:

- Dependencies install.
- Prisma client generates.
- TypeScript build passes.
- Tests pass, or failures are fixed/documented.

## Task 2: Local Database Validation

Start local infrastructure and validate Prisma migration/seed.

Commands:

```bash
cp .env.example .env
docker compose up -d
npm run prisma:migrate -- --name init
npm run prisma:seed
```

Acceptance criteria:

- PostgreSQL, Redis, and Meilisearch start.
- Prisma migration applies.
- Turkey market seed exists.

## Task 3: Sprint 1 E2E Tests

Add e2e tests for:

- `/api/v1/health`.
- `POST /api/v1/auth/session` with mock auth enabled.
- `/me/*` rejects missing bearer token.
- `PUT /me/skin-profile` rejects writes before `skin_profile_processing` consent.
- Consent accept succeeds.
- Skin profile save/read succeeds after consent.

Acceptance criteria:

- E2E tests run in CI or documented local test setup.
- Standard response envelope is verified.
- Request ID is verified on error responses.

## Task 4: Logging And Redaction Review

Review logging and error behavior so sensitive request bodies are not logged.

Acceptance criteria:

- No auth tokens, skin profile payloads, triggers, or notes are logged.
- Any logger added follows redaction policy.
- QA risk note is updated if a gap remains.

## Task 5: Product Catalog Schema Expansion

After Sprint 1 foundation passes, expand Prisma schema toward product catalog MVP:

- brands
- product_global
- product_market
- product_market_images
- product_regulatory_checks
- ingredients
- ingredient localizations/synonyms/functions/flags
- product_market_ingredients

Acceptance criteria:

- `product_global` and `product_market` remain separate.
- Raw ingredient text is preserved.
- Verification status includes method/source/date.
- Migration applies cleanly.
