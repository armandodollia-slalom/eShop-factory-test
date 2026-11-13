---
id: TC-BUG-10-15
type: sad
sad-path: conflict
layer: unit
covers: ["Decisions: shared helper OrderStatusChangeProblem maps domain exceptions to 409"]
priority: P2
---

# TC-BUG-10-15: Cancel and Ship endpoints map OrderingDomainException to a 409 problem

## Why

- Pins the endpoint contract in-process for both handlers (existing OrdersApi unit tests already call the methods directly). Mediator mock throws OrderingDomainException("Is not possible to change the order status from Shipped to Cancelled.").

## Preconditions

- OrderServices with mediator mock throwing OrderingDomainException with no inner exception.

## Steps

1. Call `OrdersApi.CancelOrderAsync` with a non-empty request id.
2. Call `OrdersApi.ShipOrderAsync` likewise.

## Expected result

- Each returns a ProblemHttpResult with StatusCode 409 and `detail` equal to the exception message.
