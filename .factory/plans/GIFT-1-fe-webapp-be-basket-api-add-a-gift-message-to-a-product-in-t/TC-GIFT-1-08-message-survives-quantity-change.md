---
id: TC-GIFT-1-08
type: happy
layer: e2e
covers: ["AC4: message still there after changing the line's quantity"]
priority: P1
---

# TC-GIFT-1-08: The gift message survives a change of the line's quantity

## Why

- A quantity update rewrites the whole basket through the Basket API; if the WebApp sent the items without their messages, the message would be lost silently. AC4 names this action explicitly, and it crosses the WebApp and the API, so e2e.

## Preconditions

- Scenario `default`; `alice` has an empty basket.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag, open `/cart`, choose "Add a gift message", type `Happy birthday, Sam!` and save.
2. Set the line's quantity to `3` and submit the quantity update.
3. Reload `/cart`.

## Expected result

- After step 2 and after step 3 the line shows quantity 3.
- After step 2 and after step 3 the line shows `"Happy birthday, Sam!"` under the product name and an "Edit" action.
