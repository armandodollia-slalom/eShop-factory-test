---
id: TC-CHK-1-12
type: happy
layer: e2e
covers: ["AC2"]
priority: P1
---

# TC-CHK-1-12: Shopper places an order with the note left empty through the UI

## Why

- AC2 end to end: the optional field left untouched must not block the order and must read back as null.

## Preconditions

- Scenario `chk-1` (extends `default`, see `_index.md`): alice has item 99 "Adventurer GPS Watch" quantity 1 in her basket; no orders exist.
- Browser signed in as alice (password `Pass123$`).

## Steps

1. On the checkout page fill the address fields with Address `1 Main St`, City `Seattle`, State `WA`, Country `USA`, Zip code `98101`.
2. Leave `Delivery note (optional)` empty.
3. Press `Place order`.
4. As alice, call `GET /api/orders?api-version=1.0` and then `GET /api/orders/<ordernumber>?api-version=1.0`.

## Expected result

- After step 3 the browser leaves the checkout page.
- Step 4 lists exactly one order and its `deliveryNote` is `null`.
