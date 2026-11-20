---
id: TC-BRAND-2-10
type: happy
layer: e2e
covers: ["AC4: card without products is not a link", "AC4: still says \"No products yet\""]
priority: P1
---

# TC-BRAND-2-10: Card of a brand without products is not a link and says "No products yet"

## Why

- AC4 keeps a brand without products from leading to an empty catalog page, and keeps BRAND-1's "No products yet" text. Wrapping every card in a link would break the first; reworking the card for the link would risk the second. The demo catalog has no brand without products, so scenario `brand-1` provides "Acme Empty". e2e because both outcomes are rendered markup and click behaviour on the Brands page.

## Preconditions

- Test stack running with scenario `brand-1` (extends `default`): brand 14 "Acme Empty" has no items; brand 15 "Mono Gear" has one item. Anonymous visitor.

## Steps

1. Open `/brands`.
2. Find the card whose heading is "Acme Empty" (`data-brand-id` 14) and read whether it is inside a link.
3. Click the card's heading "Acme Empty".

## Expected result

- The "Acme Empty" card shows the text "No products yet".
- The card is not inside an `a` element, and it contains no `a` element.
- No link on the page has `href` `/?brand=14`.
- After the click, the browser is still on path `/brands`.
- The "Mono Gear" card (one product) is inside a link with `href` `/?brand=15`, so a single product is enough for a link.
