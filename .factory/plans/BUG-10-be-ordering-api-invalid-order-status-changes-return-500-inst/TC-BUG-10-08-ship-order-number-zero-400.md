---
id: TC-BUG-10-08
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: validation failure returns 400 (ship)"]
priority: P3
---

# TC-BUG-10-08: Shipping with order number 0 returns 400 with the validation message

## Why

- ShipOrderCommandValidator is separate from the cancel validator; the ship path needs its own check of the 400 mapping.

## Preconditions

- None.

## Steps

1. `PUT /api/orders/ship` with a new `x-requestid` guid and body `{"orderNumber": 0}`.

## Expected result

- HTTP status `400`; body text contains "No orderId found".
