---
id: TC-ORDD-1-02
type: happy
layer: e2e
covers: ["Outputs: details page shows the order number, its date, its status and its total", "AC1"]
priority: P1
---

# TC-ORDD-1-02: Details page shows the order number, date, status and total

## Why

- AC1 requires the order's number, date, status and total on the details page. These are the summary of the order and would be wrong if the page read a different order or mapped fields wrongly. e2e because the requirement is what the shopper sees on the rendered page.

## Preconditions

- Scenario `ordd-1`: order 1 belongs to bob, status `Shipped`, total `309.97`, order date `2026-11-01 10:00:00 UTC`.
- Signed in as bob (`bob` / `Pass123$`).

## Steps

1. Open `/user/orders` and read the text of the `.order-date` cell in the row for order `1`.
2. Click the order-number link `1` in that row.

## Expected result

- In the details summary row: `.order-number` text is `1`; `.order-total` text is `$309.97`; `.order-status` text is `Shipped`.
- The details `.order-date` text equals the `.order-date` text read on My orders in step 1, and it is not empty.
