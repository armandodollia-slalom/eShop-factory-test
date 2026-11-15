---
id: TC-BUG-40-01
type: happy
layer: e2e
covers: ["Steps to Reproduce 1-3", "Expected: page 1 starts with the cheapest product; no product on a later page costs less", "Acceptance criterion"]
priority: P1
---

# TC-BUG-40-01: Price: Low to High puts the cheapest products on page 1 and continues on page 2

## Why

- This is the bug report replayed as written: before the fix, page 1 showed $79.99 to $249.99 and page 2 started at $59.99. It must be e2e because the defect was in how the WebApp applied the sort (client-side reorder of one page), which an API test alone cannot catch.

## Preconditions

- Test stack running with scenario `default` loaded (101 items; cheapest item 31 "Guardian Blue Chalk Bag" $21.99).
- New browser context (no `aw.catalog.sort.v1` in localStorage).

## Steps

1. Open `BASE_URL` (`/`), no query string. Wait for 9 `.catalog-items .catalog-item` cards.
2. Click the Sort trigger `#catalog-sort-trigger`, then click the option with role `option` and name `Price: Low to High`.
3. Wait for the URL to be `/?sort=price-asc` and read the 9 cards (`.catalog-product-content .name` and `.price`).
4. Click the link with aria-label `Next page`.

## Expected result

- After step 3, the URL query is exactly `sort=price-asc` (no `page`), and page 1 shows these 9 cards in this order:
  1. Guardian Blue Chalk Bag, `$21.99`
  2. SummitStone Chalk Bag, `$29.99`
  3. Gravity Waterproof Dry Bag, `$49.99`
  4. LumenHead Headlamp, `$49.99`
  5. Velocity Red Bike Helmet, `$54.99`
  6. Compass Pro A-320 Professional Compass, `$59.99`
  7. Nebula Pro Headlamp, `$59.99`
  8. Stellar Duffle Bag, `$59.99`
  9. Trailblazer Bike Helmet, `$59.99`
- After step 4, the URL query contains `sort=price-asc` and `page=2`; page 2 shows 9 cards, the first is "Excursion 20L Daypack" `$64.99`, and every price on page 2 is greater than or equal to `$59.99` (the highest price on page 1).
- `.catalog-sort-value` reads `Price: Low to High` on both pages.
- No card priced `$79.99` or higher appears on page 1.
