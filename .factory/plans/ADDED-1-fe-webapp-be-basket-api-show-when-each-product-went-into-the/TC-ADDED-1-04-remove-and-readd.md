---
id: TC-ADDED-1-04
type: happy
layer: e2e
covers: ["AC3: removed and added again shows the date it was added again"]
priority: P2
---

# TC-ADDED-1-04: Removing a product and adding it again shows it with today's date

## Why

- AC3 through the real UI: removal and a fresh add must produce a line that again carries a date (not none, not a lost one). Within one test run the old and new dates are the same day, so the "later day" proof is the unit case TC-ADDED-1-08.

## Preconditions

- Scenario `default`; `alice` signed in with item 99 in the bag (added in this test).

## Steps

1. On `/cart`, click "Remove Adventurer GPS Watch from your bag"; confirm the bag no longer lists it.
2. Open the product page of item 99 and click "Add to shopping bag".
3. Open `/cart`.

## Expected result

- One line "Adventurer GPS Watch", quantity 1.
- The line shows `Added on <today UTC, d MMM yyyy>`.
