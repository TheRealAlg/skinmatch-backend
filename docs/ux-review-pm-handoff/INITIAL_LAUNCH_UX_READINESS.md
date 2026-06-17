# Initial Launch UX Readiness Notes

Date: 2026-06-17

Input: UX review handoff, PM roadmap notes, current Android visual-trust branch, and latest welcome/search/detail screenshots.

## Launch Positioning

For the first launch, SkinMatch should feel like a trustworthy skincare product reader, not a recommendation engine making strong claims.

The UX expert's main recommendation still holds: make the app more graphical, but not more decorative. For launch, every graphic should help with one of five jobs:

- Recognize a product.
- Understand ingredient context.
- Understand data confidence.
- Understand verification status.
- Choose a safe next action.

## What We Have Already Accommodated

- Product visuals now use a reusable Android component with real `imageUrl` support and category-aware fallback art.
- Search cards no longer expose raw `not_scored` style copy.
- Search cards prioritize product identity, verification, and data confidence.
- Product detail opens with a decision summary before raw ingredients.
- The welcome hero is now a transparent product cutout rather than a rectangular photo block.
- The two awkward floating drops in the welcome hero were removed while keeping the product group intact.

## PM Note: Development Asset Plan

We now have a concrete visual asset system for SkinMatch, not just a concept direction. The plan is to use generated graphics only where they are safe and useful: unbranded product fallbacks, empty states, and profile visualization references.

The generated assets are documented here:

`docs/ux-review-pm-handoff/DEVELOPMENT_ASSET_PLAN.md`

We created:

- 7 unbranded product fallback thumbnails: serum, cleanser, sunscreen, moisturizer, toner, mask, and unknown category.
- 5 empty-state illustrations: no search results, low data confidence, consent required, profile incomplete, and no saved products.
- 1 skin profile avatar reference image.
- Runtime logic for the actual face/profile avatar:
  `android-app/app/src/main/java/com/skinmatch/mvp/ui/components/SkinProfileAvatar.kt`

Important PM point:

The face avatar should not be a static generated image in production. It should be a deterministic Compose component that reflects the user's declared profile fields: oiliness, dryness, redness, pores, barrier/dehydration, texture, and related profile signals.

That protects SkinMatch from implying face scanning or diagnosis.

Recommended PM priority:

1. Build the product image system: real `imageUrl` first, generated category fallback second.
2. Redesign search cards: product image, brand, product name, category, confidence, verification, and ingredient chips.
3. Add empty-state illustrations for low-data, no-results, consent, and profile-incomplete states.
4. Add the `Cilt profilin` avatar using runtime avatar logic, not a static bitmap.
5. Keep generated images away from product truth: no fake branded products, diagnosis, efficacy claims, or before/after visuals.

PM framing:

> The development asset plan gives us a production-safe visual system. It lets SkinMatch become more graphical without compromising trust. Generated images should support fallback states and onboarding polish, while real product data, real product images, and deterministic UI should handle anything that affects user decisions.

## Launch Must-Haves

1. Product Recognition
   - Real product images should render whenever backend `imageUrl` is available.
   - Missing product images should fall back to neutral unbranded category visuals.
   - Generated or illustrative assets must never imply a real product identity.

2. Data Trust
   - No raw backend status should appear in user-facing UI.
   - Confidence, verification, and compatibility must remain visually distinct.
   - Low-data products should say what is missing rather than sounding broken.

3. Product Detail Clarity
   - Detail should answer: what product is this, how reliable is the data, what ingredients matter, and what should the user do next.
   - Raw ingredient text should remain available, but not be the first decision surface.

4. Medical Boundary
   - No diagnosis claims.
   - No before/after promises.
   - No efficacy certainty from meters, scores, or badges.
   - Caution language should stay educational and careful.

## Launch Should-Haves

1. First-Run Flow
   - Welcome should remain premium but reduce any decorative elements that compete with the primary actions.
   - Guest browsing should continue to work as a low-friction entry path.

2. Home Surface
   - Add a simple returning-user dashboard only if it can be product/useful, not decorative.
   - Minimum viable home: profile status, recent products, and one clear next action.

3. Empty States
   - Use compact illustrations for no search results, consent required, profile incomplete, and low data confidence.
   - Each empty state needs one action and no medical or product claims.

## Keep Out Of Initial Launch

- Numeric fit scores unless scoring inputs, confidence thresholds, and explanatory copy are approved.
- Generated real-brand product imagery.
- Shopping/cart flows.
- Medical-sounding skin assessment.
- Before/after or transformation visuals.

## Next Recommended Slice

The next launch-readiness slice should be backend/data led:

1. Define the product image source policy.
2. Seed or ingest approved `imageUrl` values for launch catalog products.
3. Confirm Android receives stable product fields for image, brand, name, category, ingredients, confidence, and verification.
4. Add a small QA checklist that tests search, detail, missing-image fallback, low-confidence copy, and no raw backend statuses.

After that, Android should replace the current minimal network image loader with a production image-loading path only if needed for caching, placeholders, or retry behavior.
