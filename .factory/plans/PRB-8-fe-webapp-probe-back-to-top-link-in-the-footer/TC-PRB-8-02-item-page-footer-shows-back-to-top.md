---
id: TC-PRB-8-02
type: happy
layer: e2e
covers: ["AC1: Given any page of the store"]
priority: P2
---

# TC-PRB-8-02: Item page footer shows "Back to top" next to the legal links

## Why

- AC1 says "any page of the store", not only the catalog; the footer is in the shared layout, and this case proves it on a second, routed page with a path parameter. A separate case keeps the catalog check (TC-PRB-8-01) independent of item data.

## Preconditions

- Test stack running with scenario `default`; item 99 "Adventurer GPS Watch" exists; anonymous shopper.

## Steps

1. Open `/item/99`.
2. Locate the footer list with accessible name `Legal`.

## Expected result

- The page shows the item name `Adventurer GPS Watch`.
- The `Legal` list has exactly 4 items, in order: `Privacy`, `Terms`, `Cookies`, `Back to top`, and the `Back to top` link is visible.
- The link's `href` attribute is `item/99#top` (current page plus `#top`), not `#top` or `/#top`.
