---
id: TC-BUG-15-03
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: body {} rejected like a missing body"]
priority: P1
---

# TC-BUG-15-03: Draft request with body `{}` is rejected with 400

## Why

- A body of {} deserializes to a command with null Items; it must not reach the handler's item processing. Separate case from the missing body because it takes a different binding path.

## Preconditions

- Ordering.API runs in-process through `OrderingApiFixture` (`tests/Ordering.FunctionalTests`); the fixture's auto-authorize middleware supplies the caller identity `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`; the client sends `api-version=1.0`.

## Steps

1. `POST /api/orders/draft` with `Content-Type: application/json` and body `{}`.

## Expected result

- Status is 400.
- The `Content-Type` header is `application/problem+json`.
