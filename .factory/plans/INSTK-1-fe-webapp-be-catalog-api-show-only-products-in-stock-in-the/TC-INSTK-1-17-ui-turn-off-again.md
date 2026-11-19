---
id: TC-INSTK-1-17
type: happy
layer: e2e
covers: ["AC1: 'In stock only' is an option the shopper can switch", "AC2: the address bar keeps the choice"]
priority: P2
---

# TC-INSTK-1-17: Turning "In stock only" off again lists every product

## Why

- An option that can be switched on must be switchable off without "Clear all filters", or the shopper loses other filters to undo it. Kept separate from TC-INSTK-1-15 because it checks that only `inStock` is removed while the brand stays.

## Preconditions

- Test stack running scenario `instk-1`.
- Anonymous shopper on `/?brand=1&inStock=true` ("7 products").

## Steps

1. Click "In stock only" in the filter panel.

## Expected result

- The address bar has no `inStock` parameter and still contains `brand=1`.
- The toolbar reads "10 products"; Trailblaze hiking backpack, Raven Swift Snowboard and Blizzard Snowboard are listed among the cards across the pages.
- "In stock only" does not show its active state; "Daybird" still does; the active-filter count reads 1.
