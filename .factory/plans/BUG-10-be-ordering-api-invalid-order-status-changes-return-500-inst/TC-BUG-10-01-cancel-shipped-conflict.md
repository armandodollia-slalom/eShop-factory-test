---
id: TC-BUG-10-01
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 400 or 409 for cancel of Shipped order", "Decisions: OrderingDomainException maps to 409 with domain message"]
priority: P1
---

# TC-BUG-10-01: Cancelling a Shipped order returns 409 Conflict with the domain message

## Why

- This is the exact bug reproduction (alice cancels her Shipped order, previously 500). Functional layer because the status mapping spans endpoint, mediator pipeline and persistence. Ordering.API functional test (OrderingApiTests) with an order seeded directly in the test Postgres database; request sent with a valid bearer identity.

## Preconditions

- An order with Id 5 in status Shipped exists.

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with header `x-requestid: <new guid>`, body `{"orderNumber": 5}`.

## Expected result

- Status code is 409 (not 500).
- ProblemDetails `detail` is `Is not possible to change the order status from Shipped to Cancelled.`.
- The body does not contain `Cancel order failed to process.`.
