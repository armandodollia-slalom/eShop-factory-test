---
id: TC-BUG-10-06
type: sad
sad-path: not-found
layer: functional
covers: ["Suggested fix: return 404 when the order does not exist", "Decisions: false ship result maps to 404"]
priority: P1
---

# TC-BUG-10-06: Shipping an order that does not exist returns 404

## Why

- Ship endpoint mirror of the cancel not-found case. Ordering.API functional test (OrderingApiTests) with an order seeded directly in the test Postgres database; request sent with a valid bearer identity.

## Preconditions

- No order with Id 999999 exists.

## Steps

1. `PUT /api/orders/ship?api-version=1.0` with `x-requestid: <new guid>`, body `{"orderNumber": 999999}`.

## Expected result

- Status code is 404.
- ProblemDetails `detail` is `Order 999999 was not found.`.
