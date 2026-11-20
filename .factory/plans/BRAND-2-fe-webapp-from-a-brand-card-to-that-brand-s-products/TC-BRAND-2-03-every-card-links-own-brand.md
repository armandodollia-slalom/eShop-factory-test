---
id: TC-BRAND-2-03
type: happy
layer: e2e
covers: ["AC1: a brand's card (every brand with products)", "Implementation Notes: link to /?brand=<id>"]
priority: P2
---

# TC-BRAND-2-03: Every brand card with products links to the catalog filtered to its own brand

## Why

- AC1 applies to any brand's card. A loop that links every card to the same id, or an off-by-one between card and brand, would pass TC-BRAND-2-01 for one brand and fail shoppers for the others. Checking all 13 demo cards' targets catches that without clicking each one. e2e because the hrefs are rendered by the Brands page.

## Preconditions

- Test stack running with scenario `default`: 13 brands (ids 1 to 13), each with at least 3 items. Anonymous visitor.

## Steps

1. Open `/brands`.
2. For each of the 13 cards, read the brand id on the card (`data-brand-id`) and the `href` of the link that contains the card.

## Expected result

- Each of the 13 cards is inside a link.
- Each link's `href` is `/?brand=<id>` with the `data-brand-id` of the card it contains (for example the "Daybird" card links to `/?brand=1`, the "XE" card to `/?brand=13`).
- The 13 hrefs are all different.
