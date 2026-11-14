---
id: TC-CHK-1-09
type: happy
layer: functional
covers: ["AC8", "Outputs: every other field unchanged"]
priority: P1
---

# TC-CHK-1-09: An order stored before the change reads back with deliveryNote null and unchanged fields

## Why

- AC8: protects existing data after the migration adds a nullable column; it needs a row written without the note, which a POST through the new code cannot distinguish from TC-CHK-1-02.

## Preconditions

- Scenario `chk-1` (extends `default`), which seeds legacy order 9001 for bob (identity `bc8b0071-21af-41ab-b1d2-15c4efc368df`): `DeliveryNote` column NULL (as a pre-migration row), OrderDate 2026-01-15T10:00:00Z, status Submitted, description `Legacy order stored before the delivery note`, address 1 Main St, Seattle, WA, 98101, USA, one order item (productId 99, `Adventurer GPS Watch`, units 1, unitPrice 10.00).

## Steps

1. `GET /api/orders/9001?api-version=1.0` as bob (the owner of order 9001).

## Expected result

- Returns 200.
- `deliveryNote` is `null`.
- `ordernumber`, `date`, `status`, `description`, `street`, `city`, `state`, `zipcode`, `country`, `total` and `orderitems` (productname `Adventurer GPS Watch`, units 1, unitprice 10.00) have the seeded values listed in Preconditions (`date` 2026-01-15T10:00:00Z, status `Submitted`, street `1 Main St`, city `Seattle`, state `WA`, zipcode `98101`, country `USA`, total 10.00).
