---
id: TC-INSTK-1-13
type: happy
layer: e2e
covers: ["AC3: paging keeps every filter", "AC2: pages count only in-stock products"]
priority: P1
---

# TC-INSTK-1-13: Paging keeps the type and "In stock only" filters

## Why

- AC3 says paging keeps every filter; a pager link built without `inStock` would show out-of-stock products on page 2 and a different total. Ski/boarding with "In stock only" has 14 products, so there are exactly two pages.

## Preconditions

- Test stack running scenario `instk-1`.
- Anonymous shopper on `/?type=3&inStock=true`.

## Steps

1. In the pager, click page number 2.

## Expected result

- The address bar contains `type=3`, `inStock=true` and `page=2`.
- The toolbar reads "14 products"; the pager shows 2 pages with page 2 current.
- The page shows exactly 5 cards: Powder Pro Snowboard, Shadow Black Snowboard, SummitRider Snowboard Boots, Venture 2022 Snowboard, Zero Gravity Ski Goggles.
- None of Raven Swift Snowboard, Blizzard Snowboard, Blizzard Rider Snowboard, Cosmic Purple Snowboard is shown.
- "Ski/boarding" and "In stock only" still show their active state.
