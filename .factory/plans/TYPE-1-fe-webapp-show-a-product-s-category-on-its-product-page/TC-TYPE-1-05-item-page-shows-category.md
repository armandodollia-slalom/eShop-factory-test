---
id: TC-TYPE-1-05
type: happy
layer: e2e
covers: ["AC1: Category entry with value Footwear", "AC1: next to the existing Brand entry", "AC1: in the same style"]
priority: P1
---

# TC-TYPE-1-05: Product page of item 1 shows Category Footwear right after Brand, in the same style

## Why

- AC1 is the user-visible outcome: label, value, position next to Brand and same styling. Only the rendered page in a browser can show order and computed styles, so this runs on e2e through the WebApp on the test stack. Anonymous is enough: the details list does not depend on sign-in.

## Preconditions

- Test stack with scenario `default`; item 1 "Wanderer Black Hiking Boots" of brand "Daybird" and type "Footwear".
- Not signed in.

## Steps

1. Open `/item/1` in the WebApp.

## Expected result

- `dl.item-meta` under `p.item-desc` contains, in order, exactly: `dt` "Brand", `dd` "Daybird", `dt` "Category", `dd` "Footwear".
- The "Category" `dt` has the same computed `color`, `font-size` and `font-weight` as the "Brand" `dt`; the "Footwear" `dd` has the same computed `color`, `font-size` and `font-weight` as the "Daybird" `dd`.
- The "Category" and "Footwear" elements are visible.
