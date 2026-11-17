---
id: TC-BUG-44-06
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: every empty field shows that it is required", "Expected: message under Address names \"Address\"", "Expected: message under Zip code names \"Zip code\""]
priority: P2
---

# TC-BUG-44-06: Only the empty fields show a message when Address and Zip code alone are cleared

## Why

- "Every empty field shows that it is required" implies filled fields show nothing; this checks the renamed messages appear per field and in the summary without the other fields' messages, which the all-empty cases cannot distinguish. e2e because the messages are rendered by the page.

## Preconditions

- Test stack running with scenario `default`; user `bob` has an empty basket and no orders.

## Steps

1. Sign in as `bob`.
2. Add "Explorer 45L Backpack" to the shopping bag.
3. Navigate to `/checkout`.
4. Fill City with "Seattle", State with "WA" and Country with "USA"; clear the Address and Zip code inputs.
5. Click **Place order**.

## Expected result

- The message inside the `Address` label reads "The Address field is required."; the message inside the `Zip code` label reads "The Zip code field is required.".
- The `City`, `State` and `Country` labels show no validation message.
- The validation summary contains exactly two items: "The Address field is required." and "The Zip code field is required.".
- The browser stays on `/checkout`.
