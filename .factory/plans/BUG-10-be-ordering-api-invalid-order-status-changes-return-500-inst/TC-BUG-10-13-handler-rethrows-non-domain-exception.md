---
id: TC-BUG-10-13
type: sad
sad-path: dependency-failure
layer: unit
covers: ["Decisions: non-domain exceptions are logged and rethrown (500), never reported as not found"]
priority: P1
---

# TC-BUG-10-13: IdentifiedCommandHandler rethrows a non-domain exception instead of returning false

## Why

- A server fault (e.g. DB failure) must not be masked as 404 "not found"; cheapest at unit level with a substituted mediator that throws. MSTest in Ordering.UnitTests, NSubstitute.

## Preconditions

- IdentifiedCommandHandler built with a mediator mock whose Send throws InvalidOperationException, and a logger mock.

## Steps

1. Call `Handle` with an IdentifiedCommand<CancelOrderCommand, bool>.

## Expected result

- The InvalidOperationException propagates out of `Handle`.
- The logger received an error-level entry.
- Handle does not return false.
