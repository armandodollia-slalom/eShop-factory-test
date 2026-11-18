---
id: TC-BUG-48-02
type: happy
layer: functional
covers: ["Expected: as in step 2 (GET /api/catalog/items/{id})", "Expected: everything else in the answer is unchanged, the same fields"]
priority: P1
---

# TC-BUG-48-02: Each item fetched by ids is identical to the same item fetched on its own

## Why

- The story's expected result is that the batch answer carries the brand "as in step 2" and that "everything else in the answer is unchanged: the same fields". Comparing each batch item field by field with the single-item endpoint (which already includes the brand) catches both a still-missing brand and any accidental change to other fields (for example a dropped or newly added property from changing the query). Functional runs both real endpoints against the same seeded database.

## Preconditions

- Catalog seeded with the demo catalog (items 1 and 2 as in TC-BUG-48-01).

## Steps

1. Send `GET /api/catalog/items/by?ids=1&ids=2&api-version=1.0` anonymously; keep the JSON objects for `id` 1 and `id` 2.
2. Send `GET /api/catalog/items/1?api-version=1.0` anonymously; keep the JSON object.
3. Send `GET /api/catalog/items/2?api-version=1.0` anonymously; keep the JSON object.

## Expected result

- All three requests answer `200 OK`.
- The batch object for `id` 1 has exactly the same set of property names as the step 2 object, and every property has the same value, including `catalogBrand` = `{"id": 1, "brand": "Daybird"}`.
- The batch object for `id` 2 has exactly the same set of property names as the step 3 object, and every property has the same value, including `catalogBrand` = `{"id": 2, "brand": "Gravitator"}`.
