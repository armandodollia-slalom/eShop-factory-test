---
id: TC-GIFT-1-04
type: happy
layer: e2e
covers: ["AC3: edit and save shows the new message"]
priority: P1
---

# TC-GIFT-1-04: Editing a gift message replaces the shown message

## Why

- AC3 lets the shopper change the message until checkout; the edit path pre-fills and overwrites a stored value, a different code path from the first save, so it gets its own case. Browser flow, so e2e.

## Preconditions

- Scenario `default`; `alice` has an empty basket.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag, open `/cart`, choose "Add a gift message", type `Happy birthday, Sam!` and save.
2. On the same line choose "Edit".
3. Replace the box's text with `Congratulations, Alex!`.
4. Save the message.

## Expected result

- After step 2 the message box contains `Happy birthday, Sam!`.
- After step 4 the line shows `"Congratulations, Alex!"` under the product name and an "Edit" action.
- The text `Happy birthday, Sam!` no longer appears on the page.
