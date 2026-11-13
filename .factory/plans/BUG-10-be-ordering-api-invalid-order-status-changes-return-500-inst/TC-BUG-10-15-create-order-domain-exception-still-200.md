---
id: TC-BUG-10-15
type: sad
sad-path: conflict
layer: unit
covers: ["Deviations: CreateOrderAsync catches the propagated exception and keeps previous behavior (200)"]
priority: P3
---

# TC-BUG-10-15: POST /api/orders still returns 200 when order creation hits a domain exception

## Why

- The handler change must not alter order creation; the story defers fixing that response to BUG-9, so this pins the current behavior against accidental change.

## Preconditions

- Unit test of OrdersApi.CreateOrderAsync: mediator throws OrderingDomainException for the IdentifiedCommand<CreateOrderCommand, bool>.

## Steps

1. Call `OrdersApi.CreateOrderAsync` with a non-empty request id and a valid CreateOrderRequest.

## Expected result

- The call does not throw.
- The result is `Ok` (200).
- A log entry for the exception is written.
