---
id: TC-BUG-10-14
type: sad
sad-path: dependency-failure
layer: unit
covers: ["Implementation Notes: other command failures still return 500"]
priority: P2
---

# TC-BUG-10-14: A false command result still returns 500 for cancel and ship

## Why

- Story states other failures stay 500; guards against over-broad 4xx mapping.

## Preconditions

- `GetOrderAsync(5)` returns an order; `IMediator.Send` returns `false`.

## Steps

1. Call `CancelOrderAsync(<guid>, new CancelOrderCommand(5), services)`.
2. Call `ShipOrderAsync(<guid>, new ShipOrderCommand(5), services)`.

## Expected result

- Cancel returns `ProblemHttpResult` with status 500 and detail "Cancel order failed to process."
- Ship returns `ProblemHttpResult` with status 500 and detail "Ship order failed to process."
