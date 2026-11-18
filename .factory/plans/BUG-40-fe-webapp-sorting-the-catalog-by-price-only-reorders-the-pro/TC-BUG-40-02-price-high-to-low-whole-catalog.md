---
id: TC-BUG-40-02
type: happy
layer: e2e
covers: ["Expected: Price: High to Low works the same way in its own order"]
priority: P1
---

# TC-BUG-40-02: Price: High to Low orders the whole catalog from the most expensive product

## Why

- The ticket names "Price: High to Low" as broken in the same way. A separate case is needed because it is a different sort direction and tie-break (price descending, then name ascending), and the last page proves the cheapest products end the catalog, not just page 1.

## Preconditions

- Scenario `default` loaded. New browser context.

## Steps

1. Open `BASE_URL` (`/`).
2. Click `#catalog-sort-trigger`, then the option named `Price: High to Low`.
3. Read the 9 cards on page 1.
4. Click the link with aria-label `Next page`; read the first card.
5. Click the page link with text `12` in `.catalog-pagination`; read the cards.

## Expected result

- After step 2 the URL query is exactly `sort=price-desc`.
- Page 1 shows, in order: Gravity 5000 All-Mountain Skis `$699.00`, GravityZone All-Mountain Skis `$699.00`, Venture 2022 Snowboard `$499.00`, Blizzard Snowboard `$449.99`, Cosmic Purple Snowboard `$419.99`, Glacier Frost Snowboard `$419.99`, Powder Pro Snowboard `$399.00`, Blizzard Freestyle Snowboard `$379.00`, Shadow Black Snowboard `$379.00`.
- Page 2's first card is Raven Swift Snowboard `$349.00`.
- Page 12 (URL query contains `sort=price-desc` and `page=12`) shows exactly 2 cards: SummitStone Chalk Bag `$29.99`, then Guardian Blue Chalk Bag `$21.99`.
- `.catalog-sort-value` reads `Price: High to Low` on pages 1, 2 and 12.
