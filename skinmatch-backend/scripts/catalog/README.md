# Catalog Import Pipeline

SkinMatch uses a review-first catalog pipeline. Fetch scripts create candidate
files for discovery. Import scripts only write rows that have been explicitly
reviewed and marked `approvedForImport=true`.

## Commands

```bash
npm run catalog:fetch:open-beauty-facts -- --queries=serum,cleanser --limit=25
npm run catalog:import:dry-run -- --file catalog-candidates/reviewed-products.json
npm run catalog:import:reviewed -- --file catalog-candidates/reviewed-products.json
```

Generated candidate files live under `catalog-candidates/`, which is ignored by
git. Commit only curated fixtures or approved import files.

## Catalog Ops Admin

The backend also exposes a review queue for product operations:

- Panel: `GET /api/v1/admin` or `GET /api/v1/admin/catalog/panel`
- Queue reviewed JSON: `POST /api/v1/admin/catalog/candidates/from-reviewed-products`
- Fetch Open Beauty Facts candidates into files and the review queue:
  - `POST /api/v1/admin/catalog/candidates/fetch-open-beauty-facts`
- List/review/import candidates:
  - `GET /api/v1/admin/catalog/candidates`
  - `PATCH /api/v1/admin/catalog/candidates/:id/review`
  - `POST /api/v1/admin/catalog/candidates/:id/import`
- Manage Turkish taxonomy and ingredients:
  - `GET /api/v1/admin/catalog/categories`
  - `POST /api/v1/admin/catalog/categories`
  - `GET /api/v1/admin/catalog/ingredients`
  - `POST /api/v1/admin/catalog/ingredients`
  - `PATCH /api/v1/admin/catalog/ingredients/:id/localizations/tr-TR`

Admin API routes require the `x-skinmatch-admin-key` header. The browser panel
is public so it can load normally; actions from the panel still send the admin
key header. Set `ADMIN_API_KEY` in `.env`; local development falls back to
`skinmatch-local-admin` when `NODE_ENV` is not `production`.

The queue marks missing approvals, unknown categories, unknown ingredients,
missing Turkish localizations, and missing product images before import. Admins
can add category aliases and ingredient Turkish names/descriptions, then approve
and import the candidate once unresolved issues are cleared.

## Trust Rules

- Do not scrape retailer pages without permission.
- Do not import Open Beauty Facts candidates directly into the live catalog.
- Do not mark imported rows as `uts_checked`; that is reserved for a future UTS
  verification adapter.
- Do not use generated images for real branded product identity.
- Preserve image `sourceUrl` and `usageRightsNote` whenever `imageUrl` is set.
- Unknown ingredients are mapped with low confidence and no invented functions
  or safety flags.

## Reviewed Product Shape

Required fields:
- `approvedForImport`
- `brandName`
- `localProductName`
- `category`
- `barcodeGtin`
- `rawIngredientText`
- `sourceName`
- `sourceUrl`
- `verificationStatus`
- `dataConfidence`

Optional fields:
- `globalCanonicalName`
- `imageUrl`
- `imageSourceUrl`
- `imageUsageRightsNote`
- `ingredientAliases`

## Official Implementation References

- Open Beauty Facts: https://github.com/openfoodfacts/openbeautyfacts
- UTS citizen product query: https://utsuygulama.saglik.gov.tr/UTS/vatandas
- GS1 Turkiye Verified by GS1: https://www.gs1tr.org/view/icerik/verified-by-gs1.php
- Google Manufacturer Center API: https://developers.google.com/manufacturers/reference/rest
