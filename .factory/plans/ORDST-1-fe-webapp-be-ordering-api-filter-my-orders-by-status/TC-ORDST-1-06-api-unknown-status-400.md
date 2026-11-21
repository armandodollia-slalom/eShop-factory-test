---
id: TC-ORDST-1-06
type: sad
sad-path: validation
layer: functional
covers: ["AC5: A status that is not one of the six names answers 400 with a problem detail"]
priority: P1
---

# TC-ORDST-1-06: GET /api/orders?status=Delivered answers 400 with a problem detail

## Why

- AC5 requires an unknown name to be rejected rather than ignored (which would silently return every order) or matched to nothing (which would return `[]`). The rejection happens before any order is read, so the cheaper functional layer (Ordering.API in-process against real Postgres) covers it.

## Preconditions

- Ordering functional test host running; requests authenticated as a test user.

## Steps

1. `GET /api/orders?api-version=1.0&status=Delivered` as the authenticated test user.

## Expected result

- Status `400 Bad Request`.
- `Content-Type` is `application/problem+json`.
- Body is a problem detail whose `status` field is `400`.
- The body is not a JSON array.
