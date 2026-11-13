---
id: TC-BUG-10-16
type: sad
sad-path: dependency-failure
layer: unit
covers: ["Deviations: other exceptions still return default"]
priority: P2
---

# TC-BUG-10-16: IdentifiedCommandHandler still returns default for other exceptions

## Why

- Non-domain faults must keep their old behavior (and so a 500 at the endpoint).

## Preconditions

- `ExistAsync` returns false; inner `IMediator.Send` throws `InvalidOperationException`.

## Steps

1. Call `Handle` on an identified cancel command.

## Expected result

- No exception escapes; the result is `false` (`default(bool)`).
