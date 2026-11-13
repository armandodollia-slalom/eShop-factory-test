---
id: TC-BUG-10-16
type: sad
sad-path: validation
layer: unit
covers: ["Decisions: invalid commands (OrderingDomainException wrapping ValidationException) map to 400"]
priority: P2
---

# TC-BUG-10-16: An OrderingDomainException wrapping a ValidationException maps to 400

## Why

- The helper distinguishes invalid commands from rule violations by InnerException; without a case a regression would turn validation errors into 409. Unit level.

## Preconditions

- Mediator mock throwing OrderingDomainException whose InnerException is a FluentValidation ValidationException.

## Steps

1. Call `OrdersApi.CancelOrderAsync` with a non-empty request id.
2. Call `OrdersApi.ShipOrderAsync` likewise.

## Expected result

- Each returns a ProblemHttpResult with StatusCode 400 and `detail` equal to the exception message.
