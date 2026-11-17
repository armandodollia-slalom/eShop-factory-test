---
id: TC-BUG-46-04
type: happy
layer: e2e
covers: ["Expected: the message goes away once a valid quantity is applied"]
priority: P2
---

# TC-BUG-46-04: The message disappears once a valid quantity is applied after a too-large one

## Why

- The ticket states the message must go away after a valid quantity is applied; a stale message would tell the shopper their valid value was rejected. It needs the too-large post first, so it is its own case. e2e because the message is page state across two enhanced form posts.

## Preconditions

- Test stack running with scenario `default` reloaded: user `bob` has an empty basket.
- Catalog item 7 "Explorer 45L Backpack", $149.99.

## Steps

1. Sign in as `bob` / `Pass123$`.
2. Open `/item/7` and click "Add to shopping bag".
3. Open `/cart`.
4. In the input labelled "Quantity of Explorer 45L Backpack", clear the value, type `5000000000` and press Enter. Confirm "Enter a smaller quantity." is shown.
5. In the same input, clear the value, type `3` and press Enter.

## Expected result

- After step 5: no element with text "Enter a smaller quantity." is on the page.
- The input "Quantity of Explorer 45L Backpack" shows `3`; the item's total column shows `$449.97`; the summary badge shows `3`; the summary Total shows `$449.97`.
