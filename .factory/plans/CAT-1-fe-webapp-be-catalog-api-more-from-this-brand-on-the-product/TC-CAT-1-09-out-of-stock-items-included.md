---
id: TC-CAT-1-09
type: happy
layer: functional
covers: ["Open Questions: out-of-stock items are included"]
priority: P2
---

# TC-CAT-1-09: Out-of-stock brand-mates are included

## Why

- The story's answered open question says out-of-stock items are returned (stock is not part of the story). A stock filter added later or by mistake would silently remove items; item 1003 "Charlie Pack" has stock 0 to detect that. Functional layer: depends on the data only.

## Preconditions

- Scenario `brand-mates`: item 1003 "Charlie Pack" has AvailableStock 0.

## Steps

1. `GET /api/catalog/items/1001/brand-mates?api-version=1.0`.

## Expected result

- Status `200 OK`; the array contains the item with id 1003 "Charlie Pack" as its second element, with `availableStock` 0 if the field is part of the item shape.
