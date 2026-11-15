---
id: TC-BUG-36-05
type: sad
sad-path: validation
layer: functional
covers: ["Expected: the validation problem names the parameter (both invalid)"]
priority: P2
---

# TC-BUG-36-05: v1 list with pageIndex=-1 and pageSize=-1 names both parameters

## Why

- The Expected result says the problem names the invalid parameter; when both are invalid, a check that stops at the first failure would hide the second. Separate case because it checks error aggregation, not either single rule. Functional layer for the same reason as case 01.

## Preconditions

- Catalog API in-process on the functional fixture with the seeded catalog (101 items). Anonymous caller.

## Steps

1. `GET /api/catalog/items?api-version=1.0&pageIndex=-1&pageSize=-1`.

## Expected result

- Status `400 Bad Request` (not `500`).
- Response header `Content-Type` is `application/problem+json`.
- Body JSON has `status` equal to `400` and an `errors` object containing both keys `PageIndex` and `PageSize`, each with a non-empty array of messages.
