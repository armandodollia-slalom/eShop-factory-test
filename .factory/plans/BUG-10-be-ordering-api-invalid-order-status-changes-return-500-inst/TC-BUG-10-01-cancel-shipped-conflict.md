---
id: TC-BUG-10-01
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 for cancel on Shipped order", "Implementation Notes: OrdersApi.CancelOrderAsync / InvalidStatusChange"]
priority: P1
---

# TC-BUG-10-01: Cancelling a Shipped order returns 409 with the domain message

## Why

- This is the exact reproduction from the bug (order 5, Shipped): it returned 500 and must now be a client error. Functional layer because the whole path (endpoint, MediatR, IdentifiedCommandHandler, EF, domain exception) must be exercised against a real database.

## Preconditions

- An order with `OrderNumber` N exists in the Ordering database with status `Shipped` (seeded directly through the `OrderingContext`).
- Authenticated caller (the fixture's auto-authorize identity).

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with header `x-requestid: <new guid>` and body `{"orderNumber": N}`.
2. `GET /api/orders/N`.

## Expected result

- Step 1: status `409`; body is `ProblemDetails` with `status` 409, `title` "Invalid order status change" and `detail` "Is not possible to change the order status from Shipped to Cancelled."
- Status is not 500.
- Step 2: order N still has status `shipped`.
