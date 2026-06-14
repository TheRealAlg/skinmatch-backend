# Product Catalog Data Plan

## Current State

SkinMatch can already serve the MVP catalog shape:

- Product search and browse through `GET /api/v1/products/search`.
- Product detail through `GET /api/v1/products/{id}`.
- Barcode lookup through `GET /api/v1/products/barcode/{gtin}`.
- Per-product verification status, data confidence, raw ingredient text, normalized ingredient mappings, ingredient functions, ingredient flags, and product image URL fields.

The current seed data is only a small development fixture. It proves the contract, but it is not enough for the real product purpose.

## Readiness

We are ready for a curated ingestion pilot, not a broad public catalog launch.

The app is ready to consume catalog data when records include:

- Brand, local product name, category, market, GTIN when available.
- Product image URL or locally hosted asset reference.
- Raw ingredient text from label, brand page, or retailer page.
- Verification source, method, checked date, and data confidence.
- Normalized ingredient mappings with confidence.
- Conservative ingredient functions and flags.

We are not ready to claim recommendation quality until we also have:

- Enough products for target Turkish skincare categories.
- Repeatable source capture and review workflow.
- Product history and user outcome data.
- Similar-user evidence model.
- A strict safety copy review for fit explanations.

## Ingestion Strategy

Start with a curated Turkey-market set instead of scraping broadly.

1. Define priority categories:
   - cleanser
   - moisturizer
   - serum
   - sunscreen
   - acne/blemish support
   - barrier repair

2. Collect source evidence per product:
   - product label or package image
   - official brand page where available
   - retailer page as secondary support
   - GTIN/barcode when visible
   - product image permission/source note

3. Store every product with confidence:
   - `uts_checked` only when verified against an approved regulatory source
   - `label_reviewed` when label/package evidence was reviewed
   - `retailer_sourced` when based on retailer data
   - `user_submitted` only for unreviewed submissions

4. Normalize ingredients:
   - preserve raw ingredient text
   - map each ingredient to canonical INCI where possible
   - keep local Turkish display names
   - assign mapping confidence
   - flag uncertain mappings instead of hiding them

5. Host images deliberately:
   - do not rely on `example.com` seed URLs outside development
   - store source attribution
   - prefer approved image storage before enabling production image rendering

## Next Implementation Tasks

Backend:

- Add an admin/import format for curated product batches.
- Add import validation that rejects missing source, confidence, or raw ingredient text.
- Add product image storage fields for approved hosted images.
- Add a review queue for user-submitted products.
- Add tests for browse-without-query and Windows-safe seed execution.

Android:

- Show browse results on the Search tab before typing.
- Render real product images once hosted URLs are available.
- Add product submission placeholder flow for missing products.
- Improve Product Detail imagery and ingredient sections using the same premium visual system.

Data:

- Build the first curated batch of 25-50 Turkey-market products.
- Prioritize products that cover common user goals and triggers.
- Track every source and confidence decision in the import file.
