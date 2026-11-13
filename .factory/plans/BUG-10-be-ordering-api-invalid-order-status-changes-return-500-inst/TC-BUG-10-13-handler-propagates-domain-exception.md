---
id: TC-BUG-10-13
type: sad
sad-path: conflict
layer: unit
covers: ["Deviations: IdentifiedCommandHandler lets OrderingDomainException propagate"]
priority: P2
---

# TC-BUG-10-13: IdentifiedCommandHandler rethrows OrderingDomainException but still swallows other exceptions

## Why

- The catch filter change is the root of the fix; a unit test with a substituted mediator pins that domain exceptions escape while generic exceptions keep returning the default result.

## Preconditions

- IdentifiedCommandHandlerTest setup with NSubstitute IMediator, IRequestManager and logger.
- Mediator.Send of the inner command is configured to throw OrderingDomainException in case A and InvalidOperationException in case B.

## Steps

1. Case A: call `Handle` with an IdentifiedCommand<CancelOrderCommand, bool>.
2. Case B: call `Handle` with the mediator throwing InvalidOperationException.

## Expected result

- Case A: the same `OrderingDomainException` instance propagates out of `Handle`.
- Case B: `Handle` does not throw and returns `false`.
