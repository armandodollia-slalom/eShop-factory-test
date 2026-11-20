---
id: TC-BRAND-2-05
type: happy
layer: e2e
covers: ["AC2: \"All brands\" link under the title opens the Brands page"]
priority: P1
---

# TC-BRAND-2-05: "All brands" link under the brand title opens the Brands page

## Why

- AC2 gives the shopper a way back to the other brands. The link must sit under the title (the header subtitle) and lead to the Brands page; a link to `/` (the unfiltered catalog) would look right and break the story's "go back to the other brands". e2e because it is a navigation through the header.

## Preconditions

- Test stack running with scenario `default`. Brand 1 is "Daybird". Anonymous visitor.

## Steps

1. Open `/?brand=1` and wait until the page header title reads "Brand: Daybird".
2. Click the link "All brands" in the page header subtitle.

## Expected result

- Before the click, the page header subtitle contains exactly one link, with text "All brands".
- After the click, the browser is on path `/brands` with no query.
- The Brands page heading "Brands" is shown, with 13 brand cards.
