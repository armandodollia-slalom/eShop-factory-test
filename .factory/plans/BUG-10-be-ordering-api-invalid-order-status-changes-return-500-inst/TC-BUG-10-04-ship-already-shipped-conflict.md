---
id: TC-BUG-10-04
type: sad
sad-path: conflict
layer: functional
covers: ["Decisions: ship rule violation maps to 409", "Order.SetShippedStatus non-Paid state"]
priority: P2
---

# TC-BUG-10-04: Shipping an already Shipped order returns 409 Conflict

## Why

- Repeat shipment is a realistic invalid transition distinct from a not-yet-paid order. Ordering.API functional test (OrderingApiTests) with an order seeded directly in the test Postgres database; request sent with a valid bearer identity.

## Preconditions

- An order with Id 8 in status Shipped exists.

## Steps

1. `PUT /api/orders/ship?api-version=1.0` with `x-requestid: <new guid>`, body `{"orderNumber": 8}`.

## Expected result

- Status code is 409.
- ProblemDetails `detail` is `Is not possible to change the order status from Shipped to Shipped.`.
