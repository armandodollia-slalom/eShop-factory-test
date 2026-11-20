---
id: TC-BUG-44-02
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: message under Zip code names \"Zip code\"", "Actual: \"The ZipCode field is required.\"", "Steps to Reproduce 1-4"]
priority: P1
---

# TC-BUG-44-02: Empty Zip code shows "The Zip code field is required." under Zip code

## Why

- The second half of the defect: the Zip code message named the property "ZipCode". A separate case so a missing or misspelled display name for this field (for example "Zipcode") is reported on its own. The message only exists in the rendered page, hence e2e.

## Preconditions

- Test stack running with scenario `default`; user `bob` has an empty basket and no orders.

## Steps

1. Sign in as `bob`.
2. Add "Explorer 45L Backpack" to the shopping bag.
3. Navigate to `/checkout`.
4. Clear the Address, City, State, Zip code and Country inputs.
5. Click **Place order**.

## Expected result

- The validation message inside the `Zip code` label reads exactly "The Zip code field is required.".
- No text on the page contains "The ZipCode field is required." and no validation message contains "ZipCode".
- The browser stays on `/checkout`.
