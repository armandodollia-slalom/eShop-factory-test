---
id: TC-CAT-1-13
type: happy
layer: e2e
covers: ["AC6: following a card opens that item's product page", "Outputs: each card links to its own product page"]
priority: P1
---

# TC-CAT-1-13: Following a brand-mate card opens that item's product page

## Why

- AC6 last clause: the card must link to its own item, not to the current one. E2E because the navigation and the rendered target page are only visible in the browser.

## Preconditions

- Scenario `brand-mates` loaded; browser not signed in.

## Steps

1. Open `/item/1001`.
2. In the "More from Brand Alpha" section, click the card "Bravo Pack".

## Expected result

- The browser URL path becomes `/item/1002`.
- The page heading is "Bravo Pack".
- The section on the new page has the heading "More from Brand Alpha" and does not contain a card named "Bravo Pack" (the item itself); it contains "Aardvark Target".
