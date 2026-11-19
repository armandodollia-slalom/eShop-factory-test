---
id: TC-BUG-46-05
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: message shown next to that item", "Expected: bag totals unchanged"]
priority: P2
---

# TC-BUG-46-05: With two items in the bag, the message appears only next to the item with the too-large quantity

## Why

- The ticket places the message "next to that item"; with more than one item a fix that shows it on every row, or on the wrong row, would mislead the shopper. The other item's quantity must also stay untouched. e2e because the per-row rendering is in the WebApp page.

## Preconditions

- Test stack running with scenario `default` reloaded: user `bob` has an empty basket.
- Catalog items 7 "Explorer 45L Backpack" ($149.99) and 99 "Adventurer GPS Watch" (price as seeded in scenario `default`).

## Steps

1. Sign in as `bob` / `Pass123$`.
2. Open `/item/7` and click "Add to shopping bag".
3. Open `/item/99` and click "Add to shopping bag".
4. Open `/cart`. Record the summary Total (T) shown with both items at quantity 1.
5. In the input labelled "Quantity of Explorer 45L Backpack", clear the value, type `5000000000` and press Enter.

## Expected result

- The "Explorer 45L Backpack" row shows the text "Enter a smaller quantity.".
- The "Adventurer GPS Watch" row contains no "Enter a smaller quantity." text; exactly one such message is on the page.
- Both inputs ("Quantity of Explorer 45L Backpack", "Quantity of Adventurer GPS Watch") show `1`; the summary badge shows `2`; the summary Total equals T.
