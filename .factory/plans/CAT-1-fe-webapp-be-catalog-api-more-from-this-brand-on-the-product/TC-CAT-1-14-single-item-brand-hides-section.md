---
id: TC-CAT-1-14
type: sad
sad-path: boundary
layer: e2e
covers: ["AC7", "Outputs: when the endpoint returns no items the section, heading included, is not shown"]
priority: P1
---

# TC-CAT-1-14: The only item of its brand shows no "More from" section and the page is otherwise unchanged

## Why

- AC7: an empty heading or an empty box would be visible noise; the whole section must be absent while the product details still render. E2E because it concerns what the browser shows.

## Preconditions

- Scenario `brand-mates` loaded; item 1020 "Lonely Lantern" is the only item of "Brand Solo"; browser not signed in.

## Steps

1. Open `/item/1020`.

## Expected result

- The product details of "Lonely Lantern" (name, price, picture, description) are shown.
- No element contains the text "More from"; there is no "More from Brand Solo" heading and no brand-mate section element.
- No product card appears below the product details.
