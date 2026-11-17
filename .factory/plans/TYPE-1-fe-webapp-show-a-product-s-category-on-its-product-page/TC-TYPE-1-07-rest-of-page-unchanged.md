---
id: TC-TYPE-1-07
type: happy
layer: e2e
covers: ["AC4: name, picture, description, brand, price, Add to shopping bag button and More from … section unchanged"]
priority: P2
---

# TC-TYPE-1-07: Rest of the product page is unchanged for a signed-in shopper

## Why

- AC4 guards against the markup change breaking neighbouring page elements. The "Add to shopping bag" button only renders for a signed-in shopper, so the case signs in as `alice`. e2e is the only layer that renders the page.

## Preconditions

- Test stack with scenario `default`; item 1 "Wanderer Black Hiking Boots", price 109.99, brand "Daybird" with 9 other items; `alice`'s basket is empty.
- Signed in as `alice` / `Pass123$`.

## Steps

1. Open `/item/1` in the WebApp.

## Expected result

- The page header title is "Wanderer Black Hiking Boots" and its subtitle is "Daybird"; the browser tab title is "Wanderer Black Hiking Boots | AdventureWorks".
- The product image `img.item-media-img` has `alt` "Wanderer Black Hiking Boots" and loads (naturalWidth greater than 0).
- `p.item-desc` starts with "Daybird's Wanderer Hiking Boots in sleek black are perfect for all your outdoor adventures."
- The "Brand" entry in `dl.item-meta` reads "Daybird".
- The price reads "$109.99".
- A submit button with text "Add to shopping bag" is visible and enabled.
- The section headed "More from Daybird" is visible with 4 product cards, none of them "Wanderer Black Hiking Boots".
