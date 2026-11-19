---
id: TC-BUG-36-02
type: sad
sad-path: validation
layer: functional
covers: ["Steps to Reproduce 2", "Expected: 400 application/problem+json naming PageSize"]
priority: P1
---

# TC-BUG-36-02: v1 list with pageSize=-1 returns 400 naming PageSize

## Why

- Reproduces step 2: a negative page size reached `Take(pageSize)` and failed with an empty `500`. Separate from case 01 because the problem must name the specific parameter that is wrong; functional layer for the same reason as case 01.

## Preconditions

- Catalog API in-process on the functional fixture with the seeded catalog (101 items). Anonymous caller.

## Steps

1. `GET /api/catalog/items?api-version=1.0&pageSize=-1` (no `pageIndex`, so it defaults to 0).

## Expected result

- Status `400 Bad Request` (not `500`).
- Response header `Content-Type` is `application/problem+json`.
- Body JSON has `status` equal to `400` and an `errors` object containing the key `PageSize` with a non-empty array of messages.
- `errors` does not contain the key `PageIndex`.
