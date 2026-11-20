---
id: TC-BRAND-1-05
type: happy
layer: e2e
covers: ["AC1: on any page of the shop"]
priority: P2
---

# TC-BRAND-1-05: "Brands" link is in the header of an item page and opens /brands

## Why

- AC1 says the link is there "on any page"; the header renders differently on item pages (`IsItemPage`), so a page other than the catalog is checked separately from TC-BRAND-1-04. e2e because only the rendered layout shows it.

## Preconditions

- Test stack running with scenario `default`. Item 99 is "Adventurer GPS Watch". Anonymous visitor.

## Steps

1. Open `/item/99`.
2. In the header navigation, click the link with text "Brands".

## Expected result

- Before the click, the page shows "Adventurer GPS Watch" and the header navigation contains "Shop all" and "Brands" as adjacent links ("Brands" directly before or directly after "Shop all").
- After the click, the URL path is `/brands` and the page shows a heading "Brands".
