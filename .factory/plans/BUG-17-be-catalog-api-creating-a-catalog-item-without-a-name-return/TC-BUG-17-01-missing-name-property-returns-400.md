---
id: TC-BUG-17-01
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 BadRequest with a validation problem", "Actual: 500 on missing name"]
priority: P1
---

# TC-BUG-17-01: Body without a name property is rejected with 400 (api-version 2.0)

## Why

- This is the reported bug: a missing name reached Postgres and returned 500. Functional layer is the cheapest that exercises the endpoint, validation and the real database.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items, brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with JSON body `{"description":"No name","price":9.99,"catalogBrandId":1,"catalogTypeId":1,"availableStock":5,"restockThreshold":1,"maxStockThreshold":10}` (no `name` property).

## Expected result

- Status `400 BadRequest`, content type `application/problem+json`.
- Body is a validation problem: `status` is 400 and `errors` contains the key `Name` with at least one message.
- Status is not 500 and no Postgres NOT NULL error is surfaced.
