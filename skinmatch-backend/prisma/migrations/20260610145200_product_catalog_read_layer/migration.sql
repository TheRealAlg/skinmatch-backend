-- AlterTable
ALTER TABLE "product_market" ALTER COLUMN "barcode_gtin" SET NOT NULL,
ALTER COLUMN "raw_ingredient_text" SET NOT NULL,
ALTER COLUMN "verification_method" SET NOT NULL,
ALTER COLUMN "verification_source" SET NOT NULL,
ALTER COLUMN "verification_checked_at" SET NOT NULL;

-- CreateTable
CREATE TABLE "product_market_images" (
    "id" UUID NOT NULL,
    "product_market_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "source" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_market_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_regulatory_checks" (
    "id" UUID NOT NULL,
    "product_market_id" UUID NOT NULL,
    "market_id" UUID NOT NULL,
    "status" "VerificationStatus" NOT NULL,
    "method" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_url" TEXT,
    "checked_at" TIMESTAMP(3) NOT NULL,
    "checked_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_regulatory_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_localizations" (
    "id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "locale" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredient_localizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_synonyms" (
    "id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'und',
    "synonym" TEXT NOT NULL,
    "normalized_synonym" TEXT NOT NULL,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_synonyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_functions" (
    "id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "function_key" TEXT NOT NULL,
    "label_tr" TEXT,
    "note_tr" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_functions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_flags" (
    "id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "flag_key" TEXT NOT NULL,
    "label_tr" TEXT,
    "note_tr" TEXT,
    "confidence" "DataConfidence" NOT NULL DEFAULT 'low',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_market_images_product_market_id_sort_order_idx" ON "product_market_images"("product_market_id", "sort_order");

-- CreateIndex
CREATE INDEX "product_regulatory_checks_product_market_id_checked_at_idx" ON "product_regulatory_checks"("product_market_id", "checked_at");

-- CreateIndex
CREATE INDEX "product_regulatory_checks_market_id_status_idx" ON "product_regulatory_checks"("market_id", "status");

-- CreateIndex
CREATE INDEX "ingredient_localizations_locale_display_name_idx" ON "ingredient_localizations"("locale", "display_name");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_localizations_ingredient_id_locale_key" ON "ingredient_localizations"("ingredient_id", "locale");

-- CreateIndex
CREATE INDEX "ingredient_synonyms_normalized_synonym_idx" ON "ingredient_synonyms"("normalized_synonym");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_synonyms_ingredient_id_locale_normalized_synonym_key" ON "ingredient_synonyms"("ingredient_id", "locale", "normalized_synonym");

-- CreateIndex
CREATE INDEX "ingredient_functions_function_key_idx" ON "ingredient_functions"("function_key");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_functions_ingredient_id_function_key_key" ON "ingredient_functions"("ingredient_id", "function_key");

-- CreateIndex
CREATE INDEX "ingredient_flags_flag_key_idx" ON "ingredient_flags"("flag_key");

-- CreateIndex
CREATE UNIQUE INDEX "ingredient_flags_ingredient_id_flag_key_key" ON "ingredient_flags"("ingredient_id", "flag_key");

-- CreateIndex
CREATE UNIQUE INDEX "brands_normalized_name_key" ON "brands"("normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "product_global_brand_id_normalized_name_key" ON "product_global"("brand_id", "normalized_name");

-- CreateIndex
CREATE UNIQUE INDEX "product_market_market_id_barcode_gtin_key" ON "product_market"("market_id", "barcode_gtin");

-- AddForeignKey
ALTER TABLE "product_market_images" ADD CONSTRAINT "product_market_images_product_market_id_fkey" FOREIGN KEY ("product_market_id") REFERENCES "product_market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_regulatory_checks" ADD CONSTRAINT "product_regulatory_checks_product_market_id_fkey" FOREIGN KEY ("product_market_id") REFERENCES "product_market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_regulatory_checks" ADD CONSTRAINT "product_regulatory_checks_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_localizations" ADD CONSTRAINT "ingredient_localizations_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_synonyms" ADD CONSTRAINT "ingredient_synonyms_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_functions" ADD CONSTRAINT "ingredient_functions_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_flags" ADD CONSTRAINT "ingredient_flags_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
