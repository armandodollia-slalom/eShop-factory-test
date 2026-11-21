---
id: TC-ORDD-1-01
type: happy
layer: e2e
covers: ["Outputs: each order number on My orders links to /user/orders/{orderNumber}", "AC1: follows the link of that order number"]
priority: P1
---

# TC-ORDD-1-01: Order number on My orders links to its details page

## Why

- The story's entry point is the order-number link on My orders; without it the details page is unreachable from the UI. It is a separate case from the content checks so a broken link fails on its own. e2e because the link exists only in the rendered WebApp.

## Preconditions

- Test stack running scenario `ordd-1` (see `_index.md`): bob owns order 1.
- Signed in as bob (`bob` / `Pass123$`).

## Steps

1. Open `/user/orders`.
2. In the row whose `.order-number` cell reads `1`, click the link with text `1`.

## Expected result

- Before the click, the link in that cell has `href` resolving to `/user/orders/1`.
- After the click, the browser URL path is `/user/orders/1` and the page header title reads `Order details`.
