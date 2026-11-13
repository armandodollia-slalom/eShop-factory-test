---
id: TC-BUG-10-13
type: sad
sad-path: not-found
layer: unit
covers: ["Implementation Notes: OrdersApi.OrderExistsAsync and OrderNotFound"]
priority: P1
---

# TC-BUG-10-13: Cancel and ship return NotFound without sending a command when the order is missing

## Why

- Pins that the lookup guards the command, so a missing order never reaches the mediator.

## Preconditions

- `IOrderQueries.GetOrderAsync(5)` throws `KeyNotFoundException`.

## Steps

1. Call `CancelOrderAsync(<guid>, new CancelOrderCommand(5), services)`.
2. Call `ShipOrderAsync(<guid>, new ShipOrderCommand(5), services)`.

## Expected result

- Both results are `NotFound<ProblemDetails>` with `Detail` "Order 5 was not found."
- `IMediator.Send` is never called.
