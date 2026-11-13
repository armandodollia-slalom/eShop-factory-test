---
id: TC-BUG-17-02
type: sad
sad-path: validation
layer: functional
covers: ["CreateItem handles POST /api/catalog/items for v1 and v2"]
priority: P2
---

# TC-BUG-17-02: Body without a name is rejected with 400 under api-version 1.0

## Why

- Implementation notes say the endpoint serves v1 and v2; the fix must hold for both versions, so the version is a separate case.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items, brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=1.0` with the same body as TC-BUG-17-01 (no `name` property).

## Expected result

- Status `400 BadRequest`, content type `application/problem+json`.
- Body is a validation problem: `status` is 400 and `errors` contains the key `Name` with at least one message.
- Status is not 500 and no Postgres NOT NULL error is surfaced.
