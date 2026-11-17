---
id: TC-BUG-44-01
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: message under Address names \"Address\"", "Actual: \"The Street field is required.\"", "Steps to Reproduce 1-4"]
priority: P1
---

# TC-BUG-44-01: Empty Address shows "The Address field is required." under Address

## Why

- This is the core defect: the message under the Address input named the hidden property "Street". It is its own case so a regression in the Address rename fails independently of Zip code. Only the rendered checkout page shows the message, so it runs on e2e.

## Preconditions

- Test stack running with scenario `default`; user `bob` (password `Pass123$`) has an empty basket and no orders.

## Steps

1. Sign in as `bob`.
2. Open the "Explorer 45L Backpack" item page and click **Add to shopping bag**.
3. Navigate to `/checkout`.
4. Clear the Address, City, State, Zip code and Country inputs so each is an empty string.
5. Click **Place order**.

## Expected result

- The validation message inside the `Address` label reads exactly "The Address field is required.".
- No text on the page contains "The Street field is required." and no validation message contains the word "Street".
- The browser stays on `/checkout`.
