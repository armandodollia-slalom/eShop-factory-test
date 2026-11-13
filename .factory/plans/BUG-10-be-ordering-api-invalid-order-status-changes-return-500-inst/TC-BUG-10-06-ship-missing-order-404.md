---
id: TC-BUG-10-06
type: sad
sad-path: not-found
layer: functional
covers: ["Implementation Notes: Missing order -> 404"]
priority: P1
---

# TC-BUG-10-06: Shipping an order that does not exist returns 404

## Why

- Same rule on the ship endpoint; existing `ShipNonExistentOrderFails` asserts 500 and must become 404.

## Preconditions

- No order with `OrderNumber` 999999 exists.

## Steps

1. `PUT /api/orders/ship?api-version=1.0` with `x-requestid: <new guid>` and body `{"orderNumber": 999999}`.

## Expected result

- Status `404`; `ProblemDetails.title` "Order not found", `detail` "Order 999999 was not found."
