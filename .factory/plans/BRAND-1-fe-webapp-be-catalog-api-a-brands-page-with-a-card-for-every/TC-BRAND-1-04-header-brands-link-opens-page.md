---
id: TC-BRAND-1-04
type: happy
layer: e2e
covers: ["AC1: Brands link next to Shop all", "AC1: opens the Brands page at /brands"]
priority: P1
---

# TC-BRAND-1-04: Header shows a "Brands" link next to "Shop all" that opens /brands

## Why

- AC1 is the only way shoppers reach the new page; if the link is missing, misplaced or points elsewhere the feature is invisible. Header markup and routing only exist in the running WebApp, so this is e2e.

## Preconditions

- Test stack running with scenario `default`. Anonymous visitor.

## Steps

1. Open the WebApp home page `/`.
2. In the header navigation, click the link with text "Brands".

## Expected result

- Before the click, the header navigation contains a link "Shop all" and a link "Brands", and "Brands" is adjacent to "Shop all" (the navigation link directly before or directly after it).
- After the click, the URL path is `/brands` and the page shows a heading "Brands".
