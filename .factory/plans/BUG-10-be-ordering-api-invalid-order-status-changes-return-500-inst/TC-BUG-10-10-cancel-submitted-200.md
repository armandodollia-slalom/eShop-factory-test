---
id: TC-BUG-10-10
type: happy
layer: functional
covers: ["Code map: 200 unchanged (cancel)"]
priority: P1
---

# TC-BUG-10-10: Cancelling a Submitted order still returns 200

## Why

- Guards that mapping invalid cases did not break the success path of cancel.

## Preconditions

- Order 9 with status Submitted exists.

## Steps

1. `PUT /api/orders/cancel` with a new `x-requestid` guid and body `{"orderNumber": 9}`.

## Expected result

- HTTP status `200`, empty body.
- Order 9 status is Cancelled in the database.
