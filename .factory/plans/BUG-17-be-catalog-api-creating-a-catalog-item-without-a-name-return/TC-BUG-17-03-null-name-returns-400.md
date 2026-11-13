---
id: TC-BUG-17-03
type: sad
sad-path: validation
layer: functional
covers: ["Implementation Notes: missing Name"]
priority: P2
---

# TC-BUG-17-03: Explicit null name is rejected with 400

## Why

- A client can send `"name": null` instead of omitting the property; it deserializes differently from a missing property, so it is its own input.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items, brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body as in TC-BUG-17-01 plus `"name": null`.

## Expected result

- Status `400 BadRequest`, content type `application/problem+json`.
- Body is a validation problem: `status` is 400 and `errors` contains the key `Name` with at least one message.
- Status is not 500 and no Postgres NOT NULL error is surfaced.
