---
id: TC-BUG-18-08
type: happy
layer: functional
covers: ["Decision: absent id behaves like id 0 and is generated"]
priority: P2
---

# TC-BUG-18-08: Body without an id property is created with a generated id

## Why

- A body with no id deserializes to 0; the existence check must not be triggered or fail for it (the common client case).

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items with ids 1 to 101; brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with the body from TC-BUG-18-01 (no `id` property).

## Expected result

- Status `201 Created` with a `Location` header `/api/catalog/items/<n>` where `<n>` is greater than 0.
