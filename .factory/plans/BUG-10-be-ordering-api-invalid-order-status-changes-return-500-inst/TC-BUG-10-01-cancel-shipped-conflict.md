---
id: TC-BUG-10-01
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 with message", "Technical Notes: SetCancelledStatus rule violation"]
priority: P1
---

# TC-BUG-10-01: Cancelling a Shipped order returns 409 with the domain message

## Why

- This is the reported bug (cancel of a Shipped order returned 500); a domain rule violation must be a client error. Functional layer is the cheapest that exercises the endpoint, mediator pipeline and real persistence.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).
- An order with Id 5 owned by alice exists with status Shipped.

## Steps

1. `PUT /api/orders/cancel` with header `x-requestid: <new guid>`, `Content-Type: application/json`, body `{"orderNumber": 5}`.

## Expected result

- Status code is 409 Conflict (not 500).
- Body is ProblemDetails JSON: `status` 409, `detail` "Is not possible to change the order status from Shipped to Cancelled.".
- Body does not contain "Cancel order failed to process.".
