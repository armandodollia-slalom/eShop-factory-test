---
id: TC-PRB-13-07
type: sad
sad-path: boundary
layer: e2e
covers: ["AC4: filters that list no product hide the link"]
priority: P1
---

# TC-PRB-13-07: Filters that list no product hide the "Surprise me" link

## Why

- AC4 is the only negative outcome the story states: with nothing to pick, the link must not be offered. It is the just-outside boundary (0 products) of TC-PRB-13-06 (1 product); a broken guard would offer a link that leads nowhere. The page is opened by URL because once XE or Climbing is active the other tag has count 0 and is rendered `is-empty` (`aria-disabled="true"`, `pointer-events: none`), so it cannot be clicked.

## Preconditions

- Test stack running with scenario `default`. Brand XE + type Climbing lists 0 products. Anonymous shopper.
- The XE brand id and the Climbing type id are read from the filter links on the unfiltered catalog page `/`: the `href` of the brand tag "XE" (`?brand=<XE id>`) and of the type tag "Climbing" (`?type=<Climbing id>`).

## Steps

1. Open `/?brand=<XE id>&type=<Climbing id>` directly.

## Expected result

- The heading "No products match these filters" is visible.
- No element with accessible name "Surprise me" exists on the page (count 0).
- The Brand and Type filter groups are still shown with the "XE" and "Climbing" tags carrying the `active` class.
