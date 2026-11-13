---
id: TC-BUG-10-12
type: sad
sad-path: conflict
layer: unit
covers: ["Implementation Notes: OrdersApi.ShipOrderAsync and InvalidStatusChange"]
priority: P1
---

# TC-BUG-10-12: ShipOrderAsync maps OrderingDomainException to Conflict

## Why

- Separate method from cancel with its own try/catch.

## Preconditions

- `GetOrderAsync(5)` returns an order; `IMediator.Send` for the identified ship command throws `OrderingDomainException("Is not possible to change the order status from Submitted to Shipped.")`.

## Steps

1. Call `OrdersApi.ShipOrderAsync(<non-empty guid>, new ShipOrderCommand(5), services)`.

## Expected result

- Result is `Conflict<ProblemDetails>`, status 409, `Detail` equal to the exception message.
