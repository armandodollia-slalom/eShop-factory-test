---
id: TC-BUG-10-03
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: client error for ship", "Technical Notes: SetShippedStatus rule violation"]
priority: P1
---

# TC-BUG-10-03: Shipping an order that is not Paid returns 409 with the domain message

## Why

- The bug covers ship as well as cancel (OrdersApi maps both); SetShippedStatus only allows Paid.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).
- An order with Id 7 owned by alice exists with status Submitted.

## Steps

1. `PUT /api/orders/ship` with a new `x-requestid` guid and body `{"orderNumber": 7}`.

## Expected result

- Status code is 409.
- `detail` is "Is not possible to change the order status from Submitted to Shipped.".
