---
id: TC-INSTK-1-16
type: happy
layer: e2e
covers: ["AC2: only in-stock products are listed (none here)", "AC4: 'Clear all filters' turns 'In stock only' off"]
priority: P2
---

# TC-INSTK-1-16: "Clear all filters" in the empty state turns "In stock only" off

## Why

- "In stock only" can empty a selection that has products (Daybird Bags holds only the out-of-stock Trailblaze hiking backpack). The catalog then shows its own "Clear all filters" button, a second reset path (`ResetFiltersUri` in `Catalog.razor`) that AC4 also covers; if it kept `inStock`, the shopper would stay stuck on a filtered list.

## Preconditions

- Test stack running scenario `instk-1`.
- Anonymous shopper on `/?brand=1&type=4&inStock=true`.

## Steps

1. Check the page shows the empty state "No products match these filters".
2. Click the "Clear all filters" button of the empty state.

## Expected result

- Step 1: the empty state is shown and no product card is shown (Trailblaze hiking backpack is not listed).
- After step 2: the address bar has none of `brand`, `type`, `inStock`; the toolbar reads "101 products"; "In stock only" does not show its active state.
