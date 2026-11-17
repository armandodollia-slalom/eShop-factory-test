---
id: TC-BUG-44-04
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: the list of messages next to Place order uses the same names", "Actual: the list next to the button repeats both names"]
priority: P1
---

# TC-BUG-44-04: The validation summary next to Place order lists the five messages with the visible names

## Why

- The bug report says the summary list repeated "Street" and "ZipCode"; the summary is rendered separately from the per-field messages (`ValidationSummary`), so it needs its own assertion. e2e because only the page renders it.

## Preconditions

- Test stack running with scenario `default`; user `bob` has an empty basket and no orders.

## Steps

1. Sign in as `bob`.
2. Add "Explorer 45L Backpack" to the shopping bag.
3. Navigate to `/checkout`.
4. Clear the Address, City, State, Zip code and Country inputs.
5. Click **Place order**.

## Expected result

- The validation summary (`ul.validation-errors`) contains exactly five items, and their texts are, as a set: "The Address field is required.", "The City field is required.", "The State field is required.", "The Zip code field is required.", "The Country field is required.".
- No summary item contains "Street" or "ZipCode".
