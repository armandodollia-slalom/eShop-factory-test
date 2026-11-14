---
id: TC-ORD-1-02
type: happy
layer: functional
covers: ["Outputs: GET /api/orders itemCount", "AC2"]
priority: P1
---

# TC-ORD-1-02: Order of one line of 1 unit has itemCount 1

## Why

- AC2: the lower value of the count, one line with one unit, must be exactly 1. Separate from TC-ORD-1-01 because it is a distinct acceptance criterion and order.

## Preconditions

- Order 102 of alice: one line of 1 unit at 12.50.
- The caller is authenticated as alice.

## Steps

1. `GET /api/orders?api-version=1.0` as alice.

## Expected result

- Status 200.
- The element with `orderNumber` 102 has `itemCount` equal to the integer 1.
