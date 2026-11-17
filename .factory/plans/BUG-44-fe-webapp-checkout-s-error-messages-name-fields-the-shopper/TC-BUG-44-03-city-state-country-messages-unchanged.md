---
id: TC-BUG-44-03
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: messages for City, State and Country are unchanged"]
priority: P2
---

# TC-BUG-44-03: Empty City, State and Country keep their unchanged required messages

## Why

- The story requires the other three messages to stay as they were; a fix that renamed or removed them (for example a blanket display-name change or custom message) would break this. One case covers the three because they share one unchanged-behaviour requirement. e2e because the messages are rendered by the page.

## Preconditions

- Test stack running with scenario `default`; user `bob` has an empty basket and no orders.

## Steps

1. Sign in as `bob`.
2. Add "Explorer 45L Backpack" to the shopping bag.
3. Navigate to `/checkout`.
4. Clear the Address, City, State, Zip code and Country inputs.
5. Click **Place order**.

## Expected result

- The validation message inside the `City` label reads exactly "The City field is required.".
- The validation message inside the `State` label reads exactly "The State field is required.".
- The validation message inside the `Country` label reads exactly "The Country field is required.".
