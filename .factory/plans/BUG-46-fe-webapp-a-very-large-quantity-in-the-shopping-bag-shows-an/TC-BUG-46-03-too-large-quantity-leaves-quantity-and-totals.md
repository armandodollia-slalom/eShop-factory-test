---
id: TC-BUG-46-03
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: item quantity stays what it was before (1)", "Expected: bag totals unchanged"]
priority: P1
---

# TC-BUG-46-03: After a too-large quantity, the item quantity stays 1 and the totals are unchanged, also after a reload

## Why

- The ticket requires the rejected value to change nothing: neither the displayed quantity and totals nor the stored basket. A partial fix could show the message but still write the value, or show a huge total. The reload proves the basket itself was not updated. e2e because the basket is reached only through the WebApp's gRPC client on the test stack.

## Preconditions

- Test stack running with scenario `default` reloaded: user `bob` has an empty basket.
- Catalog item 7 "Explorer 45L Backpack", $149.99.

## Steps

1. Sign in as `bob` / `Pass123$`.
2. Open `/item/7` and click "Add to shopping bag".
3. Open `/cart`. Confirm quantity `1` and summary Total `$149.99`.
4. In the input labelled "Quantity of Explorer 45L Backpack", clear the value, type `5000000000` and press Enter.
5. Read the row and summary values.
6. Reload `/cart`.

## Expected result

- After step 4: the input "Quantity of Explorer 45L Backpack" shows `1`; the item's total column shows `$149.99`; the summary badge shows `1`; the summary Total shows `$149.99`.
- After step 6: the same values (`1`, `$149.99`, badge `1`, Total `$149.99`); the bag still has exactly one row.
