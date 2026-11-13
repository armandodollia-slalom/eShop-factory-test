---
id: TC-BUG-10-05
type: sad
sad-path: not-found
layer: functional
covers: ["Implementation Notes: Missing order -> 404", "OrdersApi.OrderExistsAsync"]
priority: P1
---

# TC-BUG-10-05: Cancelling an order that does not exist returns 404

## Why

- The suggested fix requires 404 for a missing order. The existing functional test `CancelNonExistentOrderFails` asserts 500 and must be updated to 404.

## Preconditions

- No order with `OrderNumber` 999999 exists.

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with `x-requestid: <new guid>` and body `{"orderNumber": 999999}`.

## Expected result

- Status `404`; `ProblemDetails.title` "Order not found", `detail` "Order 999999 was not found.", `status` 404.
- No request record is created for the command (the existence check runs before the command is sent).
