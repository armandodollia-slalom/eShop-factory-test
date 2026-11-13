---
id: TC-BUG-10-14
type: sad
sad-path: dependency-failure
layer: unit
covers: ["Decisions: other failures stay 500"]
priority: P2
---

# TC-BUG-10-14: A false command result for an existing order stays a 500 problem

## Why

- Ensures the 404 and 409 mappings did not swallow genuine server faults: when the command returns false and the order exists, the endpoint must still return the failure detail with 500.

## Preconditions

- OrdersApi unit test (OrdersWebApiTest style): mediator returns false for the command; IOrderQueries.GetOrderAsync returns an order.

## Steps

1. Call `OrdersApi.CancelOrderAsync` with a non-empty request id and `OrderNumber` 1.
2. Repeat with `ShipOrderAsync` using detail text accordingly.

## Expected result

- Cancel result is a `ProblemHttpResult` with status 500 and detail "Cancel order failed to process.".
- Ship result is a `ProblemHttpResult` with status 500 and detail "Ship order failed to process.".
