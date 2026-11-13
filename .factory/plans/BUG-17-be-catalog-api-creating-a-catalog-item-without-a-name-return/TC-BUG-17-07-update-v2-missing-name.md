---
id: TC-BUG-17-07
type: sad
sad-path: validation
layer: functional
covers: ["Decisions: ValidateItem guards UpdateItem (v2)"]
priority: P1
---

# TC-BUG-17-07: PUT v2 without a name is rejected with 400 and the item is unchanged

## Why

- The same NOT NULL violation occurs on update via SetValues; the shared validator must cover it. Checks persisted state is untouched.

## Preconditions

- Catalog API running in-process via CatalogApiFixture against the default scenario (101 items; item 1 exists). Anonymous client with the api-version header/query set as in CatalogApiTests.

## Steps

1. `GET /api/catalog/items/1?api-version=2.0`; remember `name` and `price`.
2. `PUT /api/catalog/items/1?api-version=2.0` with JSON body `{"id":1,"price":99.0,"catalogBrandId":1,"catalogTypeId":1,"availableStock":5}` (no `name`).
3. `GET /api/catalog/items/1?api-version=2.0`.

## Expected result

- Step 2: status 400 with the same `errors.Name` and `detail` as the create cases.
- Step 3: `name` and `price` equal the values from step 1.
