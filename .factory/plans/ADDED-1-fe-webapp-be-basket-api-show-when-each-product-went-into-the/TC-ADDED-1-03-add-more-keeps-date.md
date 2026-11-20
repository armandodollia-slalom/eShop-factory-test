---
id: TC-ADDED-1-03
type: happy
layer: e2e
covers: ["AC2: add more of it, date does not change"]
priority: P2
---

# TC-ADDED-1-03: Adding more of a product already in the bag keeps its "Added on" date

## Why

- AC2 names "add more of it" separately from changing the quantity; it goes through the product page's add flow rather than the bag's update, so it is a separate path that could reset the date.

## Preconditions

- Scenario `default`; `alice` signed in with item 99 in the bag at quantity 1 (added in this test), showing `Added on <today UTC>`.

## Steps

1. Open the product page of item 99 and click "Add to shopping bag" again.
2. Open `/cart`.

## Expected result

- One line "Adventurer GPS Watch" with quantity 2.
- The line shows the same `Added on <date>` text as before step 1.
