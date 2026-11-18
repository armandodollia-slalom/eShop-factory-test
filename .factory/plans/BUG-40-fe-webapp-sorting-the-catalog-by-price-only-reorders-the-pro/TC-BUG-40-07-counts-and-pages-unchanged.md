---
id: TC-BUG-40-07
type: happy
layer: e2e
covers: ["Expected: product count, filters and their counts, number of pages unchanged; each page still shows 9 products"]
priority: P2
---

# TC-BUG-40-07: Sorting does not change the product count, filter counts, page count or cards per page

## Why

- The ticket explicitly requires the count, filter counts and paging to be unaffected by the sort. The fix touches the items query and the page links, so a sort that leaked into the count or facet query would change these numbers; the e2e layer is where all four numbers are visible together.

## Preconditions

- Scenario `default` loaded (101 items; Gravitator 11; Ski/boarding 18). New browser context.

## Steps

1. Open `BASE_URL` (`/`). Read `.catalog-count`, `.page-status`, the number of `.catalog-items .catalog-item` cards, and the `.catalog-search-tag-count` of the Brand `All`, Brand `Gravitator`, Type `All` and Type `Ski/boarding` tags.
2. Click `#catalog-sort-trigger`, then the option named `Price: Low to High`.
3. Read the same seven values again.

## Expected result

- In step 1 and in step 3 the values are identical: `.catalog-count` reads `101 products`, `.page-status` reads `1 / 12`, there are 9 cards, Brand `All` count is `101`, Gravitator count is `11`, Type `All` count is `101`, Ski/boarding count is `18`.
- After step 2 the URL query is exactly `sort=price-asc`.
