---
id: TC-BUG-10-18
type: sad
sad-path: dependency-failure
layer: unit
covers: ["Deviations: CreateOrderAsync responses do not change (BUG-9 behavior)"]
priority: P2
---

# TC-BUG-10-18: CreateOrderAsync still returns 200 when the command throws

## Why

- Guards the documented non-change: create catches any exception and treats it as a failed command (200 plus warning log). Unit level.

## Preconditions

- Mediator mock throwing an exception on Send; logger mock.

## Steps

1. Call `OrdersApi.CreateOrderAsync` with a non-empty request id and a valid CreateOrderRequest.

## Expected result

- Result is Ok (200), not 4xx/5xx.
- An error-level log entry and a warning log entry are recorded.
