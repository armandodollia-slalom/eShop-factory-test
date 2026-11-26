---
id: TC-BUG-10-01
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 for cancelling a Shipped order","Technical Notes: OrderingDomainException maps to 409"]
priority: P1
---

# TC-BUG-10-01: Cancelling a Shipped order returns 409 with the domain message, not 500

## Why

- This is the reported bug (steps to reproduce). Before the fix `SetCancelledStatus` threw `OrderingDomainException` and the endpoint returned 500. Functional layer because the status code is produced by `OrdersApi` plus the real command pipeline and database.

## Preconditions

- Ordering test database contains order 5 owned by alice with status `Shipped`.
- Caller authenticated as alice.

## Steps

1. `PUT /api/orders/cancel` with header `x-requestid: <new guid>` and body `{"orderNumber": 5}`.

## Expected result

- Status is `409`.
- Body is ProblemDetails with `status` 409 and `detail` `Is not possible to change the order status from Shipped to Cancelled.`.
- Order 5 still has status `Shipped` (`GET /api/orders/5`).
