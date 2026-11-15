---
id: TC-BUG-40-10
type: happy
layer: e2e
covers: ["Expected: page 1 starts with the cheapest product", "Implementation Notes: choosing a sort resets to page 1"]
priority: P2
---

# TC-BUG-40-10: Choosing a sort on page 3 starts the sorted catalog at page 1

## Why

- A user often sorts after paging. If the new sort kept `page=3`, the user would land in the middle of the price order and never see the cheapest product, which is the visible symptom of this bug. Separate from TC-BUG-40-01, which starts on page 1.

## Preconditions

- Scenario `default` loaded. New browser context.

## Steps

1. Open `BASE_URL` + `/?page=3`; wait for `.page-status` to read `3 / 12`.
2. Click `#catalog-sort-trigger`, then the option named `Price: Low to High`.
3. Read the URL, `.page-status` and the first card.

## Expected result

- The URL query is exactly `sort=price-asc` (no `page` parameter).
- `.page-status` reads `1 / 12`.
- The first card is Guardian Blue Chalk Bag `$21.99`.
