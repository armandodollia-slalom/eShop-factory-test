---
id: TC-BUG-17-04
type: sad
sad-path: boundary
layer: functional
covers: ["Implementation Notes: empty Name"]
priority: P1
---

# TC-BUG-17-04: Empty-string name is rejected with 400

## Why

- Implementation notes state an empty Name is rejected; an empty string passes the database NOT NULL constraint, so only the validation prevents it.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items, brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body as in TC-BUG-17-01 plus `"name": ""`.

## Expected result

- Status `400 BadRequest`, content type `application/problem+json`.
- Body is a validation problem: `status` is 400 and `errors` contains the key `Name` with at least one message.
- Status is not 500 and no Postgres NOT NULL error is surfaced.
