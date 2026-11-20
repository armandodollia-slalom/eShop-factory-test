---
id: TC-GIFT-1-05
type: happy
layer: e2e
covers: ["AC3: clearing the text and saving removes the message", "AC3: \"Add a gift message\" shown again"]
priority: P1
---

# TC-GIFT-1-05: Clearing the text and saving removes the message and brings back "Add a gift message"

## Why

- AC3 makes an empty save the way to remove a message; if it stored an empty string the line would show `""` or keep "Edit". It is checked after a reload too, so the removal is proven on the server, not only in the rendered response. Browser flow, so e2e.

## Preconditions

- Scenario `default`; `alice` has an empty basket.

## Steps

1. Sign in as `alice`, add item 99 ("Adventurer GPS Watch") to the bag, open `/cart`, choose "Add a gift message", type `Happy birthday, Sam!` and save.
2. Choose "Edit" on the line, delete all text from the box so it is empty, and save.
3. Reload `/cart`.

## Expected result

- After step 2 and again after step 3 the line shows the "Add a gift message" action and no "Edit" action.
- The line shows no quoted text: neither `"Happy birthday, Sam!"` nor `""` appears.
- The line is still in the bag with quantity 1.
