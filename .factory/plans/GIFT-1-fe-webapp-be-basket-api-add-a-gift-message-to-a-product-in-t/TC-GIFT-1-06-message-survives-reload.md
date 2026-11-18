---
id: TC-GIFT-1-06
type: happy
layer: e2e
covers: ["AC4: message still there after reloading the page"]
priority: P1
---

# TC-GIFT-1-06: The gift message survives a page reload

## Why

- AC4 requires the message to be stored, not just rendered once; a reload re-reads the basket from the Basket API. Kept separate from sign-out and quantity changes because each one rebuilds the basket through a different path.

## Preconditions

- Scenario `default`; `alice` has an empty basket.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag, open `/cart`, choose "Add a gift message", type `Happy birthday, Sam!` and save.
2. Reload `/cart` with the browser (a GET of `/cart`).

## Expected result

- The line "Adventurer GPS Watch" shows `"Happy birthday, Sam!"` under the product name and an "Edit" action.
