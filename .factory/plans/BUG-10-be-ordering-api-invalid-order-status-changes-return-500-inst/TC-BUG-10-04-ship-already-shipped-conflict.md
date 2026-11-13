---
id: TC-BUG-10-04
type: sad
sad-path: conflict
layer: functional
covers: ["Technical Notes: SetShippedStatus rule violation (Shipped)"]
priority: P2
---

# TC-BUG-10-04: Shipping an already Shipped order returns 409

## Why

- Repeated ship with a new request id is a state transition that is not allowed.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).
- An order with Id 5 owned by alice exists with status Shipped.

## Steps

1. `PUT /api/orders/ship` with a new `x-requestid` guid and body `{"orderNumber": 5}`.

## Expected result

- Status code is 409.
- `detail` is "Is not possible to change the order status from Shipped to Shipped.".
