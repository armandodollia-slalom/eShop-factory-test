---
id: TC-BUG-36-03
type: sad
sad-path: validation
layer: functional
covers: ["Steps to Reproduce 3 (pageIndex, api-version=2.0)", "Expected: 400 application/problem+json naming PageIndex"]
priority: P1
---

# TC-BUG-36-03: v2 list with pageIndex=-1 returns 400 naming PageIndex

## Why

- Step 3 repeats the bug on `api-version=2.0`, which maps `/items` to a different endpoint (`ListItems-V2`, with name/type/brand filters); a fix applied only to v1 would leave v2 returning `500`. Functional layer for the same reason as case 01.

## Preconditions

- Catalog API in-process on the functional fixture with the seeded catalog (101 items). Anonymous caller.

## Steps

1. `GET /api/catalog/items?api-version=2.0&pageIndex=-1` (no `pageSize`, no filters).

## Expected result

- Status `400 Bad Request` (not `500`).
- Response header `Content-Type` is `application/problem+json`.
- Body JSON has `status` equal to `400` and an `errors` object containing the key `PageIndex` with a non-empty array of messages.
- `errors` does not contain the key `PageSize`.
