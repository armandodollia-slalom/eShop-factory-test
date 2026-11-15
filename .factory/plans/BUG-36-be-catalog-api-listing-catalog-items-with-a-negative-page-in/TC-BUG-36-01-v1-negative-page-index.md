---
id: TC-BUG-36-01
type: sad
sad-path: validation
layer: functional
covers: ["Steps to Reproduce 1", "Expected: 400 application/problem+json naming PageIndex"]
priority: P1
---

# TC-BUG-36-01: v1 list with pageIndex=-1 returns 400 naming PageIndex

## Why

- Reproduces step 1 of the bug exactly: a negative page index reached `Skip(pageSize * pageIndex)` and Postgres failed, surfacing as an empty `500`. Functional layer because only the in-process API against the real database proves the 500 is gone and the problem response is produced by the endpoint pipeline.

## Preconditions

- Catalog API in-process on the functional fixture with the seeded catalog (101 items). Anonymous caller.

## Steps

1. `GET /api/catalog/items?api-version=1.0&pageIndex=-1` (no `pageSize`, so it defaults to 10).

## Expected result

- Status `400 Bad Request` (not `500`).
- Response header `Content-Type` is `application/problem+json`.
- Body JSON has `status` equal to `400` and an `errors` object containing the key `PageIndex` with a non-empty array of messages.
- `errors` does not contain the key `PageSize`.
