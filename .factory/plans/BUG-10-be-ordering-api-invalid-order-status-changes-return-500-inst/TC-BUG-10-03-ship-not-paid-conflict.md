---
id: TC-BUG-10-03
type: sad
sad-path: conflict
layer: functional
covers: ["Decisions: ship rule violation maps to 409", "Order.SetShippedStatus"]
priority: P1
---

# TC-BUG-10-03: Shipping an order that is not Paid returns 409 Conflict

## Why

- The ship endpoint had the same 500 mapping (OrdersApi ship path); SetShippedStatus throws unless status is Paid. Ordering.API functional test (OrderingApiTests) with an order seeded directly in the test Postgres database; request sent with a valid bearer identity.

## Preconditions

- An order with Id 7 in status Submitted exists.

## Steps

1. `PUT /api/orders/ship?api-version=1.0` with `x-requestid: <new guid>`, body `{"orderNumber": 7}`.

## Expected result

- Status code is 409.
- ProblemDetails `detail` is `Is not possible to change the order status from Submitted to Shipped.`.
