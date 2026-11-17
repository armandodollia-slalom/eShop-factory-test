---
id: TC-BUG-46-01
type: happy
layer: e2e
covers: ["Expected: Quantities that work today (for example 2) still work the same way"]
priority: P1
---

# TC-BUG-46-01: Typing 2 and pressing Enter updates the item quantity and the bag totals

## Why

- The ticket requires that valid quantities keep working after the fix; the fix adds a validity check in front of the basket update, so a regression could reject or ignore valid values. It runs on e2e because the behaviour is the WebApp's enhanced form post on `/cart`.

## Preconditions

- Test stack running with scenario `default` reloaded: user `bob` (password `Pass123$`) has an empty basket.
- Catalog item 7 "Explorer 45L Backpack", unit price $149.99.

## Steps

1. Sign in as `bob` / `Pass123$`.
2. Open `/item/7` and click "Add to shopping bag".
3. Open `/cart`. Confirm the row "Explorer 45L Backpack" shows quantity 1.
4. In the input labelled "Quantity of Explorer 45L Backpack", clear the value, type `2` and press Enter.

## Expected result

- The page stays on `/cart` with the header "Shopping bag", the item row "Explorer 45L Backpack" and the summary "Your shopping bag".
- The input "Quantity of Explorer 45L Backpack" shows `2`.
- The item's total column shows `$299.98`.
- The summary badge shows `2` and the summary Total shows `$299.98`.
- No element with text "Enter a smaller quantity." is on the page.
- After reloading `/cart`, the quantity is still `2` and the summary Total is still `$299.98` (the basket was updated).
