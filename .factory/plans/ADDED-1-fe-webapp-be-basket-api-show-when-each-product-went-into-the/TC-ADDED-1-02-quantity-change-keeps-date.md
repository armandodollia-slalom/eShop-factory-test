---
id: TC-ADDED-1-02
type: happy
layer: e2e
covers: ["AC2: change quantity, date does not change"]
priority: P1
---

# TC-ADDED-1-02: Changing a line's quantity in the shopping bag keeps its "Added on" date

## Why

- AC2: the bag's quantity update sends the whole basket back, which could overwrite or drop the date. The e2e run proves the WebApp update path keeps the line's date shown; the day-level proof (date stays on an earlier day) is TC-ADDED-1-06.

## Preconditions

- Scenario `default`; `alice` signed in with item 99 in the bag at quantity 1 (added through the product page in this test), and the bag shows `Added on <today UTC, d MMM yyyy>`.

## Steps

1. On `/cart`, click "Increase quantity of Adventurer GPS Watch" twice, waiting for the quantity input ("Quantity of Adventurer GPS Watch") to show 2 and then 3.
2. Reload `/cart`.

## Expected result

- The line shows quantity 3.
- The line still shows exactly the same `Added on <date>` text recorded before step 1.
- The bag still has exactly one line.
