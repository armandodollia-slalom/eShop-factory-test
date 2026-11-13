---
id: TC-BUG-10-14
type: sad
sad-path: conflict
layer: unit
covers: ["Decisions: OrderingDomainException passes through the handler"]
priority: P1
---

# TC-BUG-10-14: IdentifiedCommandHandler lets OrderingDomainException escape

## Why

- The exception filter on the handler catch is what makes the 409 mapping possible; a swallowed exception would again yield a false result. Unit level with a mediator mock throwing OrderingDomainException.

## Preconditions

- Mediator mock whose Send throws OrderingDomainException("rule").

## Steps

1. Call `Handle` with an IdentifiedCommand<ShipOrderCommand, bool>.

## Expected result

- The same OrderingDomainException propagates.
- Handle does not return false.
