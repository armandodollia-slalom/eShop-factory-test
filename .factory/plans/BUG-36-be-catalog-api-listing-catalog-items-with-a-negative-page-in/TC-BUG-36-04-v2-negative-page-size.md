---
id: TC-BUG-36-04
type: sad
sad-path: validation
layer: functional
covers: ["Steps to Reproduce 3 (pageSize, api-version=2.0)", "Expected: 400 application/problem+json naming PageSize"]
priority: P1
---

# TC-BUG-36-04: v2 list with pageSize=-1 returns 400 naming PageSize

## Why

- Fourth request of the reproduction: negative page size on `api-version=2.0`. Covers the v2 endpoint for the second parameter so neither rule can be missing on v2. Functional layer for the same reason as case 01.

## Preconditions

- Catalog API in-process on the functional fixture with the seeded catalog (101 items). Anonymous caller.

## Steps

1. `GET /api/catalog/items?api-version=2.0&pageSize=-1` (no `pageIndex`, no filters).

## Expected result

- Status `400 Bad Request` (not `500`).
- Response header `Content-Type` is `application/problem+json`.
- Body JSON has `status` equal to `400` and an `errors` object containing the key `PageSize` with a non-empty array of messages.
- `errors` does not contain the key `PageIndex`.
