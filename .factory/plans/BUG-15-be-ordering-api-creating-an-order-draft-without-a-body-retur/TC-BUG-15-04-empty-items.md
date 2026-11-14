---
id: TC-BUG-15-04
type: sad
sad-path: boundary
layer: functional
covers: ["Decisions: Items empty is rejected", "Technical Notes: null or empty Items"]
priority: P1
---

# TC-BUG-15-04: Draft request with an empty Items list is rejected with 400

## Why

- Boundary just below the minimum of one item: an empty list must be rejected, while one item is accepted (TC-BUG-15-06).

## Preconditions

- Ordering.API runs in-process through `OrderingApiFixture` (`tests/Ordering.FunctionalTests`); the fixture's auto-authorize middleware supplies the caller identity `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`; the client sends `api-version=1.0`.

## Steps

1. `POST /api/orders/draft` with `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[]}`.

## Expected result

- Status is 400.
- The `Content-Type` header is `application/problem+json`.
