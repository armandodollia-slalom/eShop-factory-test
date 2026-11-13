---
id: TC-BUG-18-06
type: happy
layer: functional
covers: ["Decisions: callers that send an explicit id keep control"]
priority: P2
---

# TC-BUG-18-06: POST with an unused explicit id creates the item under that id

## Why

- The 409 option exists so explicit ids are honoured; this ensures the check does not reject free ids.

## Preconditions

- Scenario default; no item with id 5000 (default has 101 items).

## Steps

1. `POST /api/catalog/items?api-version=2.0` with `{"id": 5000, "name": "Explicit Id Item", "catalogBrandId": 1, "catalogTypeId": 1, "price": 10, "availableStock": 1}`.
2. `GET /api/catalog/items/5000?api-version=2.0`.

## Expected result

- Step 1 returns 201 with `Location` `/api/catalog/items/5000`.
- Step 2 returns 200 with name `Explicit Id Item`.
