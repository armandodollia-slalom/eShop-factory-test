---
id: TC-BUG-10-11
type: happy
layer: functional
covers: ["Code map: 200 unchanged (ship)"]
priority: P1
---

# TC-BUG-10-11: Shipping a Paid order still returns 200

## Why

- Guards the success path of ship after the endpoint rewrite.

## Preconditions

- Order 10 with status Paid exists.

## Steps

1. `PUT /api/orders/ship` with a new `x-requestid` guid and body `{"orderNumber": 10}`.

## Expected result

- HTTP status `200`, empty body.
- Order 10 status is Shipped in the database.
