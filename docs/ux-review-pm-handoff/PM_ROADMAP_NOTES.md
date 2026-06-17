# SkinMatch Mobile Roadmap Notes

Date: 2026-06-14

Input: UX handoff README plus current Android screenshots and concept board in `docs/ux-review-pm-handoff/assets/`.

## Reviewed Evidence

- `assets/current-welcome.png`: The welcome screen already has a premium, product-led first impression. The large cosmetic product visual and soft background are directionally right, but utility begins low on the screen.
- `assets/current-search-idle.png`: The search surface is useful and stable, but product recognition depends on generic fallback art. This is the largest trust gap in the core flow.
- `assets/current-search-results.png`: Query results expose useful backend signals, but the card hierarchy makes source/debug text and raw status copy compete with product identity.
- `assets/skinmatch-ux-concept.png`: The concept board is a strong directional reference for product imagery, ingredient chips, confidence indicators, and skin context. It should not be treated as production-ready because it includes illustrative real-brand products and compatibility scoring patterns that require data and claims guardrails.

## PM Summary

SkinMatch's next product step is to become more graphical, but not more decorative. The visual system should help users recognize products, understand personal fit, interpret ingredient meaning, see data confidence, and choose a next action.

The current app already has a calm skincare identity and a useful search flow. The trust gap is that the most decision-critical screens still rely on generic placeholders, debug-like status text, and dense result cards. The concept board points to a stronger direction: real product imagery, compact fit summaries, ingredient chips, confidence indicators, and skin-context visuals.

Recommended roadmap order:

1. P0: Product trust and recognition in search and product detail.
2. P1: Personalization surfaces that make the user's profile visible and useful.
3. P2: Brand polish, empty states, and copy refinement.

## PM Decision Brief

Recommended next bet:
Ship a P0 "Visual Trust Foundation" before expanding personalization or brand polish.

Why:
Search is the first repeatable product loop, and the current search cards are where user trust drops most visibly. The backend contract already carries valuable product signals, including product identity, ingredients, verification status, confidence, and image URL support. The next frontend/backend priority is to make those signals legible, credible, and production-safe.

What not to do yet:
- Do not ship generated real-brand product packaging as production imagery.
- Do not ship numeric fit scores broadly until scoring inputs, confidence thresholds, and user-facing explanations are approved.
- Do not make the home dashboard or onboarding more elaborate before search and detail can prove product trust.

PM decision needed:
- Approve P0 as the next implementation slice.
- Decide acceptable product image sources and rights policy.
- Decide whether compatibility scoring is hidden, qualitative, or numeric for the first release.
- Decide the primary product-detail next action: save, compare, scan/verify, or where-to-buy.

## Product Principle

Every graphic should answer a product question:

- What product am I looking at?
- Why might it fit my profile?
- What ingredients matter?
- How reliable is the data?
- What should I do next?

Avoid graphics that only make the app feel prettier while pushing decisions lower on the screen.

## Priority Matrix

| Priority | Workstream | User Problem | PM Acceptance Signal | Main Dependencies |
| --- | --- | --- | --- | --- |
| P0-A | Product image system | Users cannot confidently recognize products from generic thumbnails. | Real `imageUrl` renders when available; unbranded category fallback appears otherwise; no fake branded packaging. | Image source policy, backend image field, Android image loader/fallback component. |
| P0-B | Search result card redesign | Results expose data but do not support fast comparison. | Product identity, category, ingredients, verification, and data confidence are understood in under 5 seconds. | P0-A, status-copy map, long Turkish name handling. |
| P0-C | Product detail summary panel | Detail does not immediately explain what is known and what matters. | Top panel answers identity, confidence, verification, ingredient meaning, and next action without medical claims. | P0-A/B, ingredient grouping, scoring/compatibility policy. |
| P1-A | Personalized home dashboard | Returning users lack a useful product/profile starting point. | Home shows profile state, recent product reads, and one clear next action. | Stable product card/detail patterns, profile model. |
| P1-B | Skin profile visual summary | Profile data is easy to complete but not memorable or actionable. | Visual reflects declared profile fields only and remains non-diagnostic. | Profile taxonomy, accessibility/localization review. |
| P1-C | Onboarding visual selectors | Setup is text-heavy and can feel like form filling. | Visual selectors map cleanly to existing fields and improve completion. | Profile field stability, Turkish content review. |
| P2-A | Empty-state illustration set | Empty and blocked states feel unfinished. | Each state explains why it is empty and offers one next action. | Finalized status vocabulary, unbranded illustration style. |
| P2-B | Status/copy polish | Raw backend states reduce trust. | No raw backend status appears in the app; confidence, verification, and compatibility are distinct. | Backend status inventory, Turkish review, medical-boundary checklist. |

## Readiness And Owner Sequencing

Current readiness:
SkinMatch is ready to improve the visual product experience, but not ready to present broad recommendation or efficacy claims. The right next stage is product recognition and data transparency, not personalized scoring expansion.

Backend/data next steps:
- Confirm the product response always includes stable `imageUrl`, `brand`, `name`, `category`, `verificationStatus`, `dataConfidence`, `ingredientsRaw`, and any normalized ingredient groups the UI should display.
- Define image-source policy: approved source types, attribution/storage rules if needed, refresh behavior, and fallback behavior when images are missing or fail.
- Inventory all product/status values that can reach Android so they can be mapped to user-facing copy.
- Decide whether ingredient grouping is backend-owned, client-owned, or shared through a DTO.

Android next steps:
- Build a reusable product image component with stable dimensions, real-image loading, failure handling, and category fallbacks.
- Redesign search cards around recognition and comparison before adding new product features.
- Add a product detail summary panel that separates product fit, data confidence, verification, ingredient meaning, and caution language.
- Replace raw backend state strings with localized display labels.

Design/content next steps:
- Produce unbranded fallback thumbnail assets by category.
- Produce compact empty-state illustrations only for blocked or low-information states.
- Define Turkish copy for confidence, verification, not-scored, low-data, and caution states.
- Review every scoring or caution phrase against the no-diagnosis/no-promises boundary.

PM integration gate:
Do not move P1 personalization into build until P0 search/detail patterns prove users can recognize products, understand data quality, and distinguish confidence from compatibility.

## P0 - Product Trust And Recognition

Goal: Make search results and product detail trustworthy enough for users to tap, compare, and act.

### P0.1 Product Image System

Problem:
Current search cards use a generic bottle placeholder that weakens recognition and trust, especially for real Turkey-market products.

Recommendation:
Add a production-safe product image component.

Scope:
- Use real `imageUrl` when available.
- Add category-aware fallback thumbnails for serum, cleanser, sunscreen, moisturizer, toner, mask, and unknown.
- Preserve aspect ratio and provide stable card dimensions.
- Show a neutral fallback when no category match exists.
- Do not generate fake branded packaging for production.

Acceptance criteria:
- Product cards and detail pages display real product images when available.
- Missing images fall back to unbranded category thumbnails.
- Fallbacks include no readable brand names, claims, certification marks, or medical language.
- Image loading failure does not resize or break the card.

Dependencies:
- Backend/API agreement for `imageUrl`, image source, and cache behavior.
- Category taxonomy mapping for fallback selection.
- Product-image usage rights or source policy.

### P0.2 Search Result Card Redesign

Problem:
Current cards are information-rich but not decision-oriented. Verification, confidence, source, and scoring state are visible, but hierarchy is noisy.

Recommendation:
Redesign cards around quick comparison.

Scope:
- Left: product image.
- Main: brand, product name, category, top ingredient chips.
- Right or lower-right: fit/confidence summary when scoring exists.
- Inline badges: label reviewed, data confidence, caution state.
- Move source/debug details behind an info affordance or lower-priority detail area.

Acceptance criteria:
- A user can identify product, category, confidence, and verification state in under 5 seconds.
- Backend statuses like `not_scored` are not shown raw.
- Cards remain readable with long Turkish product names.
- Confidence and compatibility are visually distinct so users do not confuse data quality with skin fit.

Suggested PM metric:
- Increase search-result-to-detail tap-through rate.
- Reduce support or test-session confusion about `not_scored`, confidence, and verification.

### P0.3 Product Detail Summary Panel

Problem:
Product detail should answer "Should I consider this?" before showing raw ingredient or catalog context.

Recommendation:
Open detail with a decision summary panel.

Scope:
- Product image, brand, name, category.
- Fit summary if scored.
- Data confidence indicator.
- Verification indicator.
- Ingredient group summary.
- Caution notes framed as guidance, not diagnosis.
- Primary next action: save, compare, or where-to-buy, depending on available product capabilities.

Acceptance criteria:
- Product detail top area explains what is known, how confident SkinMatch is, and what matters.
- Raw ingredient text appears lower or behind expansion.
- Wording avoids diagnosis, treatment, or guaranteed results.
- Low-confidence products explicitly explain what is missing.

## P1 - Personalization Surfaces

Goal: Make the user's skin profile useful across the app, not just a completed onboarding object.

### P1.1 Home Dashboard

Problem:
The welcome screen has strong brand mood, but authenticated home needs more utility and product continuity.

Recommendation:
Create a personalized dashboard.

Scope:
- Skin profile summary card.
- Top concerns and preferences.
- Recent product reads.
- Suggested next actions.
- Today-style guidance, framed as educational and user-controlled.

Acceptance criteria:
- Home gives returning users a clear next action without searching first.
- Profile state is visible and editable.
- Recommendations explain their reason in plain product language.

### P1.2 Skin Profile Visual Summary

Problem:
Onboarding/profile data is currently text-heavy and less memorable than it could be.

Recommendation:
Use a non-medical face-zone or concern-map visual.

Scope:
- Represent declared concerns such as oiliness, dryness, sensitivity, and pore/blackhead tendency.
- Use soft functional color zones.
- Use in onboarding completion and home.

Acceptance criteria:
- Visual reflects user-entered profile data only.
- No diagnosis language or disease depiction.
- Users can still understand the summary with color alone unavailable, via labels or accessible descriptions.

### P1.3 Onboarding Visual Selectors

Problem:
Pill-only selectors can become cognitively heavy for skin profile setup.

Recommendation:
Introduce graphical controls where they reduce decision effort.

Scope:
- Level scales for sensitivity and confidence.
- Face-zone selectors for area-specific concerns.
- Simple icons for common goals and constraints.

Acceptance criteria:
- Visual controls map cleanly to existing profile fields.
- Users can complete onboarding without needing skincare expertise.
- Controls are accessible and localizable in Turkish.

## P2 - Brand Polish And Communication

Goal: Improve clarity, warmth, and trust once core product-recognition surfaces are in place.

### P2.1 Empty-State Illustration Set

Scope:
- Consent required.
- No search results.
- Low data confidence.
- Profile incomplete.
- No saved products.

Acceptance criteria:
- Illustrations are compact and functional.
- They include no brand names, product claims, medical claims, or fake certifications.
- Each empty state includes one clear next action.

### P2.2 Copy Polish For Data And Backend States

Problem:
Raw states like `not_scored` reduce trust and make the product feel unfinished.

Recommendation:
Create a user-facing status vocabulary.

Examples:
- `not_scored`: "Uyumluluk skoru henuz hesaplanmadi."
- Low confidence: "Bu urun icin veri sinirli."
- Label reviewed: "Etiket bilgisi incelendi."
- Not verified: "Etiket dogrulamasi bekleniyor."

Acceptance criteria:
- No raw backend status appears in the mobile UI.
- Copy distinguishes confidence, verification, and compatibility.
- Turkish strings are reviewed for tone and medical boundary safety.

## Suggested Release Slices

### Slice 1: Visual Trust Foundation

Ship:
- Product image component.
- Category fallback thumbnails.
- User-facing status vocabulary.
- Search card hierarchy update.

Why first:
This directly addresses the current search screenshots' largest trust gap and improves the core discovery loop.

### Slice 2: Detail Decision Summary

Ship:
- Product detail header redesign.
- Fit/confidence/verification summary.
- Ingredient group summary.
- Caution note pattern.

Why second:
Once cards earn the tap, detail must quickly justify whether the user should continue, save, or compare.

### Slice 3: Personalized Home

Ship:
- Home dashboard.
- Skin profile summary.
- Recent reads and next actions.

Why third:
Personalization becomes more valuable after product understanding and detail trust are strong.

### Slice 4: Onboarding And Empty-State Polish

Ship:
- Visual selectors.
- Empty-state illustration set.
- Copy refinements.

Why fourth:
These improve conversion and perceived quality, but should not delay the core trust fixes.

## Measurement Plan

Primary:
- Search result card comprehension in moderated tests: target under 5 seconds.
- Search-result-to-detail tap-through rate.
- Product detail save/favorite rate.
- Profile completion rate.

Secondary:
- Onboarding step drop-off.
- Empty search recovery rate.
- Frequency of users opening confidence or verification explanations.
- Support/test-session mentions of unclear scoring or status labels.

Qualitative prompts:
- "What product is this?"
- "How confident does SkinMatch seem about this product?"
- "Is this a skin-fit score, a data-quality score, or both?"
- "What would you do next?"

## Safety And Trust Guardrails

Preserve:
- No diagnosis claims.
- No before/after promises.
- No fake product claims.
- No generated real-brand product imagery for production.
- No artificial certainty from visuals, meters, or badges.

Specific UI guardrails:
- Compatibility scores must explain inputs and limitations.
- Confidence indicators must not look like efficacy ratings.
- Caution notes should recommend careful use, patch testing, or more information without implying medical advice.
- Generated graphics may be used for unbranded fallback assets, education, and empty states only.

## Open PM Questions

- What product image sources are legally and operationally acceptable for Turkey-market catalog entries?
- Should compatibility scoring appear in P0 for all users, or only after profile completion?
- What is the minimum data confidence threshold for showing a numeric fit score?
- Which next action should product detail optimize first: save, compare, scan label, or where-to-buy?
- Do we need a formal design/content review checklist for medical-boundary language before release?

## Prioritization Rationale

P0 should be prioritized because product recognition and trust affect the central discovery loop. Without real or credible fallback imagery, clear status language, and a stronger detail summary, users may not trust the catalog enough for personalization to matter.

P1 should follow because SkinMatch's differentiated value is profile-aware interpretation. Home and onboarding visuals should make that value persistent, but they depend on clear product and scoring patterns.

P2 should come after the core utility is stronger. Empty states and copy polish matter for completion and brand quality, but they should reinforce the product intelligence layer rather than lead it.
