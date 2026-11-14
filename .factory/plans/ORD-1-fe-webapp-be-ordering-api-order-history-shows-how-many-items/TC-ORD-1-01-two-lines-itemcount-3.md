---
id: TC-ORD-1-01
type: happy
layer: functional
covers: ["Outputs: GET /api/orders itemCount", "AC1"]
priority: P1
---

# TC-ORD-1-01: Order of two lines (2 units and 1 unit) has itemCount 3

## Why

- AC1 and the answered open question: the count is units summed over lines, not lines. An order with 2 lines of 2 and 1 units yields 3 (a line count would yield 2). Functional layer because the sum is computed in the EF projection and needs a real database.

## Preconditions

- Order 101 of alice (Id `50ddac7e-9b69-4d68-a91b-25100ef2e403`): line A 2 units at 10.00, line B 1 unit at 5.00.
- The caller is authenticated as alice.

## Steps

1. `GET /api/orders?api-version=1.0` as alice.

## Expected result

- Status 200.
- The element with `orderNumber` 101 has `itemCount` equal to the integer 3.
