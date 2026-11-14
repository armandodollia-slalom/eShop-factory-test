---
id: TC-BUG-15-02
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: 400 is application/problem+json"]
priority: P2
---

# TC-BUG-15-02: Rejection of a missing body is an application/problem+json response

## Why

- The implementation notes state the 400 is built with TypedResults.Problem; a separate case pins the content type and status field so a plain-text 400 would be caught.

## Preconditions

- Ordering.API runs in-process through `OrderingApiFixture` (`tests/Ordering.FunctionalTests`); the fixture's auto-authorize middleware supplies the caller identity `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`; the client sends `api-version=1.0`.

## Steps

1. `POST /api/orders/draft` with no body and no Content-Type header.

## Expected result

- Status is 400.
- The `Content-Type` header is `application/problem+json`.
- The JSON body has `"status": 400`.
