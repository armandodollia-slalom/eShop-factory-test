---
id: TC-BUG-10-15
type: sad
sad-path: conflict
layer: unit
covers: ["Deviations: IdentifiedCommandHandler rethrows OrderingDomainException"]
priority: P1
---

# TC-BUG-10-15: IdentifiedCommandHandler rethrows OrderingDomainException

## Why

- This is the root change that lets the endpoint see the rule violation; `IdentifiedCommandHandlerTest` already exists for it.

## Preconditions

- `IRequestManager.ExistAsync` returns false; the inner `IMediator.Send` throws `OrderingDomainException("x")`.

## Steps

1. Call `Handle` on an identified cancel command.

## Expected result

- The call throws `OrderingDomainException` with message "x" (it does not return `false`).
