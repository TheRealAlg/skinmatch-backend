# Sprint 1 Board

## Goal

Complete the foundation slice:

```text
auth/session
-> consent capture
-> skin profile save/read
-> Turkey market seed
```

## In Progress

- Backend scaffold validation.

## Ready

- BE-001 Backend foundation.
- BE-002 Local infrastructure.
- BE-003 Prisma core schema.
- BE-004 Turkey market seed.
- BE-005 Auth/session skeleton.
- BE-006 Consent APIs.
- BE-007 Skin profile APIs.
- QA-001 Sprint 1 QA matrix.

## Done

- Initial scaffold created.
- Codex runbook created.
- GitHub Actions CI workflow prepared.

## Blocked

- None in repo once pushed to GitHub.
- ChatGPT workspace could not run npm install due registry 403 and does not have Docker.

## Definition Of Done

- `npm install` succeeds.
- `npm run prisma:generate` succeeds.
- `npm run build` succeeds.
- `npm test` succeeds.
- Local migration and seed succeed.
- `/api/v1/health` returns standard envelope.
- Consent-gated skin profile write behavior is tested.
