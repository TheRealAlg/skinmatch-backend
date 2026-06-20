CREATE TYPE "CatalogCandidateStatus" AS ENUM ('new', 'needs_review', 'approved', 'rejected', 'imported');

CREATE TABLE "catalog_categories" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_category_localizations" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_category_localizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_category_aliases" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'und',
    "alias" TEXT NOT NULL,
    "normalized_alias" TEXT NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_category_aliases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_candidates" (
    "id" UUID NOT NULL,
    "source_name" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "market_code" TEXT NOT NULL DEFAULT 'TR',
    "locale" TEXT NOT NULL DEFAULT 'tr-TR',
    "brand_name" TEXT,
    "local_product_name" TEXT,
    "category" TEXT,
    "barcode_gtin" TEXT,
    "raw_ingredient_text" TEXT,
    "image_url" TEXT,
    "image_source_url" TEXT,
    "image_usage_rights_note" TEXT,
    "payload" JSONB NOT NULL,
    "status" "CatalogCandidateStatus" NOT NULL DEFAULT 'new',
    "approved_for_import" BOOLEAN NOT NULL DEFAULT false,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'user_submitted',
    "data_confidence" "DataConfidence" NOT NULL DEFAULT 'low',
    "reviewer" TEXT,
    "review_notes" TEXT,
    "imported_product_market_id" UUID,
    "imported_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_candidates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "catalog_candidate_issues" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "issue_key" TEXT NOT NULL,
    "field" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "message" TEXT NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_candidate_issues_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "catalog_categories_key_key" ON "catalog_categories"("key");
CREATE INDEX "catalog_categories_is_active_sort_order_idx" ON "catalog_categories"("is_active", "sort_order");

CREATE UNIQUE INDEX "catalog_category_localizations_category_id_locale_key" ON "catalog_category_localizations"("category_id", "locale");
CREATE INDEX "catalog_category_localizations_locale_display_name_idx" ON "catalog_category_localizations"("locale", "display_name");

CREATE UNIQUE INDEX "catalog_category_aliases_category_id_locale_normalized_alia_key" ON "catalog_category_aliases"("category_id", "locale", "normalized_alias");
CREATE INDEX "catalog_category_aliases_normalized_alias_idx" ON "catalog_category_aliases"("normalized_alias");

CREATE UNIQUE INDEX "catalog_candidates_source_name_source_url_key" ON "catalog_candidates"("source_name", "source_url");
CREATE INDEX "catalog_candidates_status_updated_at_idx" ON "catalog_candidates"("status", "updated_at");
CREATE INDEX "catalog_candidates_market_code_barcode_gtin_idx" ON "catalog_candidates"("market_code", "barcode_gtin");
CREATE INDEX "catalog_candidates_category_idx" ON "catalog_candidates"("category");

CREATE UNIQUE INDEX "catalog_candidate_issues_candidate_id_issue_key_field_message_key" ON "catalog_candidate_issues"("candidate_id", "issue_key", "field", "message");
CREATE INDEX "catalog_candidate_issues_issue_key_resolved_at_idx" ON "catalog_candidate_issues"("issue_key", "resolved_at");

ALTER TABLE "catalog_category_localizations" ADD CONSTRAINT "catalog_category_localizations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "catalog_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_category_aliases" ADD CONSTRAINT "catalog_category_aliases_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "catalog_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "catalog_candidate_issues" ADD CONSTRAINT "catalog_candidate_issues_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "catalog_candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
