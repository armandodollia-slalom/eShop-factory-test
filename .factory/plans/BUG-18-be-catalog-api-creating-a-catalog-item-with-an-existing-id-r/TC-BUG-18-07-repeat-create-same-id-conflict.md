---
id: TC-BUG-18-07
type: sad
sad-path: conflict
layer: functional
covers: ["Expected: 409 Conflict"]
priority: P2
---

# TC-BUG-18-07: Creating the same new explicit id twice: second call is 409

## Why

- Covers the conflict against an item created through the API rather than seeded, i.e. the check reads current state.

## Preconditions

- Scenario default; no item with id 5001.

## Steps

1. `POST /api/catalog/items?api-version=2.0` with `{"id": 5001, "name": "First", "catalogBrandId": 1, "catalogTypeId": 1, "price": 10, "availableStock": 1}`.
2. Repeat the identical request.

## Expected result

- Step 1 returns 201.
- Step 2 returns 409 with a ProblemDetails body whose `status` is 409. The `detail` text is not asserted.
- `GET /api/catalog/items/5001?api-version=2.0` still returns name `First`.
