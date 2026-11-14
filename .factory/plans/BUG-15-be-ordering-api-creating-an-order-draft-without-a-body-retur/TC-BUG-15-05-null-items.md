---
id: TC-BUG-15-05
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: Items null is rejected", "Technical Notes: null Items"]
priority: P2
---

# TC-BUG-15-05: Draft request with Items null is rejected with 400

## Why

- Explicit null Items is a distinct input from an empty list and from an absent property; the null check must hold for it too.

## Preconditions

- Ordering.API runs in-process through `OrderingApiFixture` (`tests/Ordering.FunctionalTests`); the fixture's auto-authorize middleware supplies the caller identity `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`; the client sends `api-version=1.0`.

## Steps

1. `POST /api/orders/draft` with `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":null}`.

## Expected result

- Status is 400.
- The `Content-Type` header is `application/problem+json`.
