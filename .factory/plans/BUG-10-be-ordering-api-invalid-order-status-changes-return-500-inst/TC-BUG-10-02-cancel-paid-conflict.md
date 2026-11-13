---
id: TC-BUG-10-02
type: sad
sad-path: conflict
layer: functional
covers: ["Decisions: OrderingDomainException maps to 409", "Order.SetCancelledStatus Paid branch"]
priority: P1
---

# TC-BUG-10-02: Cancelling a Paid order returns 409 Conflict

## Why

- SetCancelledStatus rejects both Paid and Shipped; the story only names Shipped, so Paid is a separate branch of the same rule that must also map to 409. Ordering.API functional test (OrderingApiTests) with an order seeded directly in the test Postgres database; request sent with a valid bearer identity.

## Preconditions

- An order with Id 6 in status Paid exists.

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with `x-requestid: <new guid>`, body `{"orderNumber": 6}`.

## Expected result

- Status code is 409.
- ProblemDetails `detail` is `Is not possible to change the order status from Paid to Cancelled.`.
