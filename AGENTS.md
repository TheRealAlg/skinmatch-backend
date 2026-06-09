# Backend Agent Instructions

This repository is the backend for the Turkey-first skincare intelligence app.

## Product Direction

- Build a skincare intelligence backend, not a makeup app, generic beauty review app, or medical treatment tool.
- Launch market is Turkey.
- Defaults: `TR`, `tr-TR`, `TRY`.
- Local product verification context: TİTCK / ÜTS.
- Privacy context: KVKK.
- Core formula: `cilt profili + ürün geçmişi + içerik uyumu + benzer kullanıcı sonuçları + Türkiye ürün verisi`.

## Backend Stack

- API: NestJS + TypeScript.
- Database: PostgreSQL.
- ORM/migrations: Prisma.
- Search: Meilisearch, with Postgres fallback until search is wired.
- Cache/jobs: Redis + BullMQ.
- Auth: Firebase Auth adapter boundary first, with backend-issued JWT.
- Admin: Retool/Appsmith-compatible APIs first.

## Engineering Rules

- Use `/api/v1` as the API prefix.
- Use a consistent response envelope:
  - Success: `{ data, meta, error: null }`
  - Error: `{ data: null, meta: { requestId }, error: { code, message, details } }`
- Treat skin profile, triggers, product history, reactions, notes, and sensitivity data as sensitive.
- Never log auth tokens or sensitive request bodies.
- Require active consent before writing sensitive profile/history/review data.
- Model catalog records with `product_global` and `product_market`; never assume the global product equals the Turkey-market product.
- Preserve raw ingredient text and store normalized mappings with confidence.
- Recommendation and ingredient language must be cautious compatibility language, not diagnosis, cure, toxicity, chemical-free, or natural-is-safe framing.

## Sprint 1 Scope

Implement the foundation slice:

- Backend foundation.
- Local PostgreSQL/Redis/Meilisearch infrastructure.
- Prisma schema for markets, users, consents, skin profile, goals, triggers, and early catalog placeholders.
- Turkey market seed.
- Auth/session skeleton.
- Consent APIs.
- Skin profile APIs.

Do not implement recommendations, reviews, product history, OCR, or admin workflows until the Sprint 1 foundation is stable.
