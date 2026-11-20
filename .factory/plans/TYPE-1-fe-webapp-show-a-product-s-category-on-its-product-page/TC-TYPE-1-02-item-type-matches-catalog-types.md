---
id: TC-TYPE-1-02
type: happy
layer: functional
covers: ["AC2: Category is the name of the product's catalog type, the same name the type filter shows", "AC3: type id and name"]
priority: P1
---

# TC-TYPE-1-02: Single-item response of item 99 carries the same type id and name as the catalog types list

## Why

- AC2 requires the shown category to be the same name the type filter shows; the filter is fed by `GET /api/catalog/catalogtypes`. Checking a second item with a different type (7, Navigation) also proves the include follows the item's own `catalogTypeId` instead of returning a fixed or first type. Functional is the cheapest layer that compares the two real endpoints.

## Preconditions

- Demo catalog: item 99 "Adventurer GPS Watch", `catalogTypeId` 7; type 7 is "Navigation".

## Steps

1. Anonymous `GET /api/catalog/items/99?api-version=1.0`.
2. Anonymous `GET /api/catalog/catalogtypes?api-version=1.0`.

## Expected result

- Step 1: status 200, `catalogTypeId` 7, `catalogType.id` 7, `catalogType.type` "Navigation".
- Step 2: status 200; the list contains exactly one entry with `id` 7, and its `type` equals `catalogType.type` from step 1 ("Navigation").
