---
id: TC-INSTK-1-12
type: happy
layer: e2e
covers: ["AC3: 'In stock only' with a brand and a type, all apply at once"]
priority: P1
---

# TC-INSTK-1-12: "In stock only" with a brand and a type applies all three

## Why

- AC3 from the shopper's side: toggling a brand or type must keep `inStock` in the URL and vice versa, or one filter silently drops another. Daybird + Ski/boarding has 4 products, 2 out of stock, so the result is small and exact.

## Preconditions

- Test stack running scenario `instk-1`.
- Anonymous shopper on `/`.

## Steps

1. Click the "Daybird" brand tag.
2. Click the "Ski/boarding" type tag.
3. Click "In stock only".

## Expected result

- The address bar contains `brand=1`, `type=3` and `inStock=true`.
- The toolbar reads "2 products"; there is no pager.
- The cards are exactly "Midnight Blue Goggles" and "Shadow Black Snowboard"; "Raven Swift Snowboard" and "Blizzard Snowboard" are not shown.
- "Daybird", "Ski/boarding" and "In stock only" all show their active state; the active-filter count reads 3.
