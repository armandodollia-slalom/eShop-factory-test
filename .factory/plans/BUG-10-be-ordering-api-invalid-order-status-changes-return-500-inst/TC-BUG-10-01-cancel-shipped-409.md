---
id: TC-BUG-10-01
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 400 or 409 with message", "Decisions: invalid transition returns 409 ProblemDetails"]
priority: P1
---

# TC-BUG-10-01: Cancelling a Shipped order returns 409 with the domain message

## Why

- This is the reported bug: the rule violation from Order.SetCancelledStatus was surfaced as 500. Functional layer because the status code comes from the real endpoint, mediator pipeline and database.

## Preconditions

- Ordering DB contains order 5 owned by the authenticated user with status Shipped (seeded through the ordering DbContext in the fixture).

## Steps

1. `PUT /api/orders/cancel` (api-version 1.0) with header `x-requestid: <new guid>` and body `{"orderNumber": 5}`.

## Expected result

- HTTP status is `409`.
- Body is `ProblemDetails` JSON with `status` 409, `title` "Invalid order status change" and `detail` "Is not possible to change the order status from Shipped to Cancelled.".
- Status is not 500; order 5 is still Shipped in the database.
