-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('accepted', 'revoked');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('account_terms', 'skin_profile_processing', 'product_history_processing', 'review_publication', 'analytics_optional');

-- CreateEnum
CREATE TYPE "SkinType" AS ENUM ('oily', 'dry', 'combination', 'normal', 'not_sure');

-- CreateEnum
CREATE TYPE "LevelWithUnknown" AS ENUM ('low', 'medium', 'high', 'not_sure');

-- CreateEnum
CREATE TYPE "PatternWithUnknown" AS ENUM ('none_low', 't_zone', 'cheeks', 'all_over', 'not_sure');

-- CreateEnum
CREATE TYPE "TendencyWithUnknown" AS ENUM ('rarely', 'sometimes', 'often', 'not_sure');

-- CreateEnum
CREATE TYPE "AcneTendency" AS ENUM ('rarely', 'occasional', 'frequent', 'not_sure');

-- CreateEnum
CREATE TYPE "SkinGoalKey" AS ENUM ('reduce_blackheads', 'reduce_breakouts', 'improve_texture', 'improve_hydration', 'repair_barrier', 'reduce_redness', 'reduce_oiliness', 'improve_dark_spots', 'reduce_dullness', 'maintain_skin_health');

-- CreateEnum
CREATE TYPE "TriggerKey" AS ENUM ('fragrance', 'alcohol_denat', 'acids', 'retinoids', 'essential_oils', 'heavy_creams', 'not_sure');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('unverified', 'user_submitted', 'retailer_sourced', 'label_reviewed', 'uts_checked');

-- CreateEnum
CREATE TYPE "DataConfidence" AS ENUM ('low', 'medium', 'high');

-- CreateTable
CREATE TABLE "markets" (
    "id" UUID NOT NULL,
    "market_code" TEXT NOT NULL,
    "default_locale" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL,
    "regulatory_context" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "auth_provider" TEXT NOT NULL,
    "provider_subject" TEXT NOT NULL,
    "default_market_id" UUID NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'tr-TR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_consents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "market_id" UUID NOT NULL,
    "consent_type" "ConsentType" NOT NULL,
    "consent_version" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL,
    "locale" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skin_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "skin_type" "SkinType" NOT NULL,
    "sensitivity_level" "LevelWithUnknown" NOT NULL,
    "oiliness_pattern" "PatternWithUnknown" NOT NULL,
    "dryness_pattern" "PatternWithUnknown" NOT NULL,
    "pores_level" "LevelWithUnknown" NOT NULL,
    "blackhead_tendency" "TendencyWithUnknown" NOT NULL,
    "clogged_pore_tendency" "TendencyWithUnknown" NOT NULL,
    "acne_tendency" "AcneTendency" NOT NULL,
    "redness_tendency" "LevelWithUnknown" NOT NULL,
    "hyperpigmentation_level" "LevelWithUnknown" NOT NULL,
    "texture_concern_level" "LevelWithUnknown" NOT NULL,
    "dehydration_level" "LevelWithUnknown" NOT NULL,
    "barrier_damage_level" "LevelWithUnknown" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_skin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skin_goals" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "goal_key" "SkinGoalKey" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skin_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_known_triggers" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "trigger_key" "TriggerKey" NOT NULL,
    "severity" "LevelWithUnknown" NOT NULL DEFAULT 'not_sure',
    "source" TEXT NOT NULL DEFAULT 'user_reported',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_known_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_global" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_global_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_market" (
    "id" UUID NOT NULL,
    "product_global_id" UUID NOT NULL,
    "market_id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "local_product_name" TEXT NOT NULL,
    "normalized_local_product_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "barcode_gtin" TEXT,
    "raw_ingredient_text" TEXT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "verification_method" TEXT,
    "verification_source" TEXT,
    "verification_checked_at" TIMESTAMP(3),
    "data_confidence" "DataConfidence" NOT NULL DEFAULT 'low',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" UUID NOT NULL,
    "inci_name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_market_ingredients" (
    "id" UUID NOT NULL,
    "product_market_id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "position" INTEGER,
    "raw_text" TEXT,
    "mapping_confidence" "DataConfidence" NOT NULL DEFAULT 'low',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_market_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "before_snapshot" JSONB,
    "after_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "markets_market_code_key" ON "markets"("market_code");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_provider_provider_subject_key" ON "users"("auth_provider", "provider_subject");

-- CreateIndex
CREATE INDEX "user_consents_user_id_consent_type_created_at_idx" ON "user_consents"("user_id", "consent_type", "created_at");

-- CreateIndex
CREATE INDEX "user_consents_market_id_idx" ON "user_consents"("market_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_skin_profiles_user_id_key" ON "user_skin_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_skin_goals_profile_id_goal_key_key" ON "user_skin_goals"("profile_id", "goal_key");

-- CreateIndex
CREATE UNIQUE INDEX "user_known_triggers_profile_id_trigger_key_key" ON "user_known_triggers"("profile_id", "trigger_key");

-- CreateIndex
CREATE INDEX "brands_normalized_name_idx" ON "brands"("normalized_name");

-- CreateIndex
CREATE INDEX "product_global_brand_id_idx" ON "product_global"("brand_id");

-- CreateIndex
CREATE INDEX "product_global_normalized_name_idx" ON "product_global"("normalized_name");

-- CreateIndex
CREATE INDEX "product_market_market_id_idx" ON "product_market"("market_id");

-- CreateIndex
CREATE INDEX "product_market_brand_id_idx" ON "product_market"("brand_id");

-- CreateIndex
CREATE INDEX "product_market_barcode_gtin_idx" ON "product_market"("barcode_gtin");

-- CreateIndex
CREATE INDEX "product_market_category_idx" ON "product_market"("category");

-- CreateIndex
CREATE INDEX "product_market_verification_status_idx" ON "product_market"("verification_status");

-- CreateIndex
CREATE INDEX "product_market_data_confidence_idx" ON "product_market"("data_confidence");

-- CreateIndex
CREATE INDEX "product_market_normalized_local_product_name_idx" ON "product_market"("normalized_local_product_name");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_normalized_name_key" ON "ingredients"("normalized_name");

-- CreateIndex
CREATE INDEX "product_market_ingredients_ingredient_id_idx" ON "product_market_ingredients"("ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_market_ingredients_product_market_id_ingredient_id_key" ON "product_market_ingredients"("product_market_id", "ingredient_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_actor_user_id_idx" ON "admin_audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "admin_audit_logs_target_type_target_id_idx" ON "admin_audit_logs"("target_type", "target_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_default_market_id_fkey" FOREIGN KEY ("default_market_id") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skin_profiles" ADD CONSTRAINT "user_skin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skin_goals" ADD CONSTRAINT "user_skin_goals_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_skin_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_known_triggers" ADD CONSTRAINT "user_known_triggers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "user_skin_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_global" ADD CONSTRAINT "product_global_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_market" ADD CONSTRAINT "product_market_product_global_id_fkey" FOREIGN KEY ("product_global_id") REFERENCES "product_global"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_market" ADD CONSTRAINT "product_market_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "markets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_market" ADD CONSTRAINT "product_market_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_market_ingredients" ADD CONSTRAINT "product_market_ingredients_product_market_id_fkey" FOREIGN KEY ("product_market_id") REFERENCES "product_market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_market_ingredients" ADD CONSTRAINT "product_market_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
