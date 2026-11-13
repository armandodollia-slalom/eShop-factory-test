---
id: TC-BUG-17-08
type: happy
layer: functional
covers: ["Implementation Notes: only missing, empty or whitespace Name rejected"]
priority: P2
---

# TC-BUG-17-08: One-character name is accepted (just inside the boundary)

## Why

- Boundary partner of the empty and whitespace cases: the shortest non-blank name must still be accepted.

## Preconditions

- Catalog API running in-process on the `default` scenario (101 items, brand 1 and type 1 exist); no authentication needed.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with body as in TC-BUG-17-07 but `"name": "A"`.

## Expected result

- Status `201 Created` with a `Location` header `/api/catalog/items/{id}`.
- `GET` of that location returns an item with `name` `A`.
