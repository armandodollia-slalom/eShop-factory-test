---
story: BRAND-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/360"
story-sha: dd747404dd07
plan-sha: deb3502dd731
verified-score: 10
verified-at: "2026-11-20T09:27:28.675Z"
verified-by: test-planner@3b45d17c/council
automation-sha: e0a522e0ee35
automation-plan-sha: deb3502dd731
automation-score: 10
automation-verified-at: "2026-11-20T15:08:24.327Z"
---
# Test plan: BRAND-1 [FE - WebApp, BE - Catalog API] - A Brands page with a card for every brand

Scope: the new Catalog API endpoint `GET /api/catalog/catalogbrands/summary?api-version=1.0` (every brand as `{ id, brand, itemCount, lowestPrice }`, ordered by brand name, `lowestPrice` null without products) is checked at the functional layer against the demo catalog, in a test class of its own with its own `CatalogApiFixture` database, because `CatalogApiTests` changes the catalog it shares (repricing, deleting and adding items). The WebApp side (the "Brands" header link, the `/brands` page, its heading, card order and card text for brands with many, one and no products) is checked at the e2e layer on the test stack. The e2e cases about card content use scenario `brand-1`, which extends `default` with one brand that has no products and one brand with exactly one product, because every demo brand has between 3 and 11 products.

Scenario `brand-1` (`extends: default`), catalogdb:

- `public.CatalogBrand`: `{ Id: 14, Brand: Acme Empty }` (no items), `{ Id: 15, Brand: Mono Gear }`.
- `public.Catalog`: `{ Id: 1001, Name: Mono Compass, Description: Mono Compass description, Price: 8.50, PictureFileName: 1.webp, CatalogTypeId: 1, CatalogBrandId: 15, AvailableStock: 10, RestockThreshold: 5, MaxStockThreshold: 200, OnReorder: false }`.

Demo catalog per brand (from `.factory/stack/scenarios/default/catalogdb.sql`, the same data the functional host seeds), in name order: AirStrider (9) 6 items from 54.99; B&R (5) 10 from 59.99; Daybird (1) 10 from 49.99; Gravitator (2) 11 from 59.99; Green Equipment (10) 7 from 59.99; Grolltex (8) 5 from 29.99; Legend (12) 8 from 21.99; Quester (4) 4 from 49.99; Raptor Elite (6) 11 from 69.99; Solstix (7) 9 from 89.00; WildRunner (3) 11 from 69.99; XE (13) 3 from 199.00; Zephyr (11) 6 from 109.99. Total 101 items.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BRAND-1-01 | Summary endpoint returns every brand once, ordered by name, with the four fields | happy | functional | AC5 (shape, every brand, order) |
| TC-BRAND-1-02 | Summary endpoint returns each brand's item count and lowest price | happy | functional | AC5 (itemCount, lowestPrice); Implementation Notes: Tests |
| TC-BRAND-1-03 | Summary endpoint returns itemCount 0 and lowestPrice null for a brand without products | happy | functional | AC5 (lowestPrice null) |
| TC-BRAND-1-04 | Header shows a "Brands" link next to "Shop all" that opens /brands | happy | e2e | AC1 |
| TC-BRAND-1-05 | "Brands" link is in the header of an item page and opens /brands | happy | e2e | AC1 ("any page") |
| TC-BRAND-1-06 | Brands page has heading "Brands" and one card per brand in alphabetical order | happy | e2e | AC2 |
| TC-BRAND-1-07 | Card of a brand with several products shows name, "N products" and "from $X.XX" | happy | e2e | AC3 (plural, price format) |
| TC-BRAND-1-08 | Card of a brand with one product shows "1 product" and "from $8.50" | happy | e2e | AC3 (singular, example price) |
| TC-BRAND-1-09 | Card of a brand without products shows "No products yet" and no price | happy | e2e | AC4 |

## No sad path

The story adds a read-only, anonymous endpoint and a page that lists it; it names no error outcome, no input that can be invalid (the endpoint takes no parameters besides the existing `api-version`) and no change to an existing error. The "no products" brand is a stated happy outcome (AC4, AC5), covered by TC-BRAND-1-03 and TC-BRAND-1-09.

## Out of scope

- The `is-current` highlight of the "Brands" link, the `data-brand-id` attribute and the card styling: Implementation Notes guidance, not acceptance criteria (BRAND-2 relies on `data-brand-id`).
- API version 2.0 of the endpoint: the story's contract names `api-version=1.0`; the implementer's note that it also answers on 2.0 is not a requirement.
- Tie-breaking by id for two brands with the same name: an implementer decision, not in the ticket.

## Open questions

- Behaviour when the Catalog API is unreachable while the Brands page loads is not defined by the story.
- "Alphabetical order" does not say whether it is case-sensitive or culture-aware; no seeded or scenario brand name distinguishes the two, so the cases assert only the order of the names given.
