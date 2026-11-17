---
kept-for: OPUS-1-1
id: TC-TYPE-1-03
type: happy
layer: functional
covers: ["AC3: the other catalog endpoints are unchanged (paged item list)"]
priority: P2
---

# TC-TYPE-1-03: Paged item list still returns items without their type

## Why

- AC3 limits the change to the single-item endpoint. A change to a shared query helper could also add the type to the paged list, changing its payload for every client. The functional layer sees the raw JSON the UI never exposes.

## Preconditions

- Demo catalog; first page ordered by name. The database is shared with `CatalogApiTests`, which creates and deletes items, so the total item count is not fixed.

## Steps

1. Anonymous `GET /api/catalog/items?PageSize=5&PageIndex=0&api-version=2.0`.

## Expected result

- Status 200; `pageIndex` 0, `pageSize` 5, `data` has 5 items and `count` is at least 5.
- Every item in `data` has a non-null `catalogBrand` (as before) and `catalogType` null, while `catalogTypeId` is set (greater than 0).
