---
id: TC-BUG-40-09
type: happy
layer: e2e
covers: ["Expected: the chosen sort stays selected ... as it does today (stored preference)", "Implementation Notes: sync replaces the URL with the stored sort when ?sort is missing; key aw.catalog.sort.v1 kept"]
priority: P2
---

# TC-BUG-40-09: Returning to the catalog without a sort restores the stored sort

## Why

- Today the sort choice persists across visits through localStorage key `aw.catalog.sort.v1`. With sorting moved to the URL, opening plain `/` must restore that choice and also apply it on the server; otherwise the label would say "Price: Low to High" over a name-ordered page, which is this bug again.

## Preconditions

- Scenario `default` loaded. One browser context used for all steps.

## Steps

1. Open `BASE_URL` (`/`).
2. Click `#catalog-sort-trigger`, then the option named `Price: Low to High`; wait for the URL query `sort=price-asc`.
3. Read `localStorage.getItem('aw.catalog.sort.v1')`.
4. Navigate with `page.goto(BASE_URL)` (plain `/`, no query string).
5. Wait for the URL, then read `.catalog-sort-value` and the first card.

## Expected result

- In step 3 the stored value is `price-asc`.
- In step 5 the URL query is exactly `sort=price-asc`, `.catalog-sort-value` reads `Price: Low to High`, and the first card is Guardian Blue Chalk Bag `$21.99`.
