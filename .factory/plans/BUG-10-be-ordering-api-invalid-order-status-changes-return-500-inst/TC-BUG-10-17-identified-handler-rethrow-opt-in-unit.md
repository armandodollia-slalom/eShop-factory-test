---
id: TC-BUG-10-17
type: sad
sad-path: conflict
layer: unit
covers: ["Implementation Notes: IdentifiedCommandHandler rethrows only for opted-in handlers"]
priority: P2
---

# TC-BUG-10-17: IdentifiedCommandHandler rethrows OrderingDomainException for cancel/ship but swallows it for create order

## Why

- Guards the scoping so create-order and integration-event handlers keep the old default-result behavior (BUG-9 relates). In-process in `IdentifiedCommandHandlerTest`.

## Preconditions

- Inner handler mock throws `OrderingDomainException`; request manager reports the id as not existing.

## Steps

1. Send an identified command whose handler has `ReportsFailuresToCaller` true.
2. Send one whose handler has it false.

## Expected result

- First: the exception propagates and the request id is not recorded.
- Second: result is the default value, no exception.
