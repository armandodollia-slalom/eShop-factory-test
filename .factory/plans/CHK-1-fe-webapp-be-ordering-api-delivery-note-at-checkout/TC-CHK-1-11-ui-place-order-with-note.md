---
id: TC-CHK-1-11
type: happy
layer: e2e
covers: ["AC1", "Outputs: checkout field"]
priority: P1
---

# TC-CHK-1-11: Shopper places an order with a delivery note through the UI

## Why

- AC1 end to end: proves the WebApp sends the note through the client to Ordering.API; the Test scope puts this at e2e.

## Preconditions

- Scenario `chk-1` (extends `default`, see `_index.md`): alice has item 99 "Adventurer GPS Watch" quantity 1 in her basket; no orders exist.
- Browser signed in as alice (password `Pass123$`).

## Steps

1. On the checkout page fill the address fields with Address `1 Main St`, City `Seattle`, State `WA`, Country `USA`, Zip code `98101`.
2. Type `Leave at the back door` in the field `Delivery note (optional)`.
3. Press `Place order`.
4. As alice, call `GET /api/orders?api-version=1.0` on the Ordering API and then `GET /api/orders/<ordernumber>?api-version=1.0`.

## Expected result

- After step 3 the browser leaves the checkout page (the order is placed).
- Step 4 lists exactly one order and its `deliveryNote` equals `Leave at the back door`.
