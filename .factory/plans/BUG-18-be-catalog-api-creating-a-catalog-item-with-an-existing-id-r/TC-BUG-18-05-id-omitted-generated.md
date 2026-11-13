---
id: TC-BUG-18-05
type: happy
layer: functional
covers: ["Decisions: omitted id lets the database generate the id"]
priority: P2
---

# TC-BUG-18-05: POST with the id omitted creates the item with a generated id

## Why

- Omitted id deserialises to 0 but is a distinct client behaviour from sending 0 explicitly; kept as a separate request shape.

## Preconditions

- Scenario default.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with `{"name": "No Id Item", "catalogBrandId": 1, "catalogTypeId": 1, "price": 10, "availableStock": 1}` (no `id` property).

## Expected result

- Status 201; `Location` is `/api/catalog/items/<n>` with `<n>` > 0 and not an existing id.
- `GET` on that location returns the item named `No Id Item`.
