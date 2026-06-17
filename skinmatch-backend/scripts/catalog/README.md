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
