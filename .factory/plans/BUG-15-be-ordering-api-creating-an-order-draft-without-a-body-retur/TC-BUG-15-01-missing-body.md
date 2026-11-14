---
id: TC-BUG-15-01
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 BadRequest", "Technical Notes: validate the body"]
priority: P1
---

# TC-BUG-15-01: Draft request without a body is rejected with 400

## Why

- This is the reported bug: a missing body raised a NullReferenceException and returned 500. Functional layer is the cheapest that exercises the real minimal-API binding and handler.

## Preconditions

- Ordering.API runs in-process through `OrderingApiFixture` (`tests/Ordering.FunctionalTests`); the fixture's auto-authorize middleware supplies the caller identity `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`; the client sends `api-version=1.0`.

## Steps

1. `POST /api/orders/draft` with no body and no Content-Type header.

## Expected result

- Response status is 400.
- The response body is non-empty.
- The status is not 500.
