---
id: TC-BUG-10-02
type: sad
sad-path: conflict
layer: functional
covers: ["Technical Notes: SetCancelledStatus rule violation (Paid)"]
priority: P2
---

# TC-BUG-10-02: Cancelling a Paid order returns 409 with the domain message

## Why

- SetCancelledStatus rejects both Paid and Shipped; a separate case guards the Paid branch of the rule.

## Preconditions

- Ordering API in-process via WebApplicationFactory against the fixture's Postgres, caller authenticated as user alice (fixture's AutoAuthorizeMiddleware).
- An order with Id 6 owned by alice exists with status Paid.

## Steps

1. `PUT /api/orders/cancel` with a new `x-requestid` guid and body `{"orderNumber": 6}`.

## Expected result

- Status code is 409.
- `detail` is "Is not possible to change the order status from Paid to Cancelled.".
