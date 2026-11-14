---
id: TC-STOCK-1-16
type: happy
layer: e2e
covers: ["Open question 2: checking In stock only resets the page to 1"]
priority: P2
---

# TC-STOCK-1-16: Checking "In stock only" on page 12 returns the catalog to page 1

## Why

- The story answers Open Question 2: checking the box resets to page 1, like the brand and type filters. Page 12 exists unfiltered (101 products) but not filtered (11 pages), so keeping the page number would show an empty page.

## Preconditions

- Test stack scenario `stock-1` (new, `extends: default`): item 1 "Wanderer Black Hiking Boots" (brand 1 Daybird) and item 2 "Summit Pro Harness" (brand 2 Gravitator) have `AvailableStock` 0; items 3 to 101 keep `AvailableStock` 100. The catalog page shows 9 products per page, ordered by name.
- Anonymous visitor.

## Steps

1. Open `/?page=12`.
2. Check the `In stock only` checkbox.

## Expected result

- The URL query contains `onlyAvailable=true` and has no `page` parameter.
- The pager marks page 1 as the current page.
- The first product card is titled `Adventurer GPS Watch`.
