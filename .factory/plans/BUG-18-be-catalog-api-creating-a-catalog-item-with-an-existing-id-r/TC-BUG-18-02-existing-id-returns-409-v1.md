---
id: TC-BUG-18-02
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict", "CreateItem v1 and v2 endpoints"]
priority: P1
---

# TC-BUG-18-02: Creating an item whose id already exists is rejected with 409 (api-version 1.0)

## Why

- The implementation notes say the handler serves v1 and v2; a separate case guards the v1 route from regressing to 500.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items with ids 1 to 101; brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=1.0` with the same JSON body as TC-BUG-18-01 (`"id":1`).

## Expected result

- Status `409 Conflict`; not 500.
