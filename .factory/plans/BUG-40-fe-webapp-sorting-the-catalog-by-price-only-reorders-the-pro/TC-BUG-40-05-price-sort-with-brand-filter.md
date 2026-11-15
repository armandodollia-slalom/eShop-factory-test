---
id: TC-BUG-40-05
type: happy
layer: e2e
covers: ["Expected: whole catalog with the active brand filter in price order across its pages", "Expected: the filters do not change"]
priority: P1
---

# TC-BUG-40-05: Price sort applies to the filtered result across its pages

## Why

- The ticket says the order applies to the catalog "with the active brand and type filters". Gravitator has 11 items (2 pages) with its two 699.00 skis last, so a per-page reorder or a sort that drops the filter would show a wrong first or second page.

## Preconditions

- Scenario `default` loaded: brand 2 "Gravitator" has 11 items. New browser context.

## Steps

1. Open `BASE_URL` (`/`).
2. In the Brand group, click the `.catalog-search-tag` link whose text starts with `Gravitator`; wait for the URL query `brand=2`.
3. Click `#catalog-sort-trigger`, then the option named `Price: Low to High`.
4. Read `.catalog-count`, `.page-status` and the 9 cards.
5. Click the link with aria-label `Next page`; read the cards.

## Expected result

- After step 3 the URL query contains `brand=2` and `sort=price-asc` and no `page`.
- In step 4, `.catalog-count` reads `11 products`, `.page-status` reads `1 / 2`, the Gravitator tag has class `active`, and page 1 shows, in order: Nebula Pro Headlamp `$59.99`, Stellar Duffle Bag `$59.99`, Gravity Hiking Backpack `$79.99`, Zero Gravity Ski Goggles `$79.99`, Gravity Harness `$89.99`, Summit Pro Harness `$89.99`, Gravity Beam Climbing Rope `$179.99`, Expedition 200 GPS Navigator `$299.00`, Cosmic Purple Snowboard `$419.99`.
- After step 5 the URL query contains `brand=2`, `sort=price-asc` and `page=2`; page 2 shows exactly 2 cards: Gravity 5000 All-Mountain Skis `$699.00`, GravityZone All-Mountain Skis `$699.00`; the Gravitator tag still has class `active`; `.catalog-sort-value` reads `Price: Low to High`.
