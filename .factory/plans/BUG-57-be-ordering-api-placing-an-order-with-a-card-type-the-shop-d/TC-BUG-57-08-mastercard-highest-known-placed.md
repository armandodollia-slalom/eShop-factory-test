---
id: TC-BUG-57-08
type: happy
layer: e2e
covers: ["What should happen: orders with a known card type are placed as before", "Known card types 1..3, upper boundary just inside"]
priority: P2
---

# TC-BUG-57-08: An order with card type 3 (MasterCard), the highest known card type, is placed with 200

## Why

- The ticket says orders with a known card type are placed as before; card type 3 is the highest id the shop lists, so it catches a check that excludes the ends of the range (the mirror of TC-BUG-57-04). The order must be saved, which the Ordering functional host cannot do, so this runs as API calls on the test stack.

## Preconditions

- Test stack up with scenario `default`; card types 1 Amex, 2 Visa, 3 MasterCard exist.
- An access token for `alice` (password `Pass123$`) with scope `orders`; note how many orders `GET /api/orders?api-version=1.0` returns for her before step 1 (N).

## Steps

1. Send `POST /api/orders?api-version=1.0` with alice's bearer token, header `x-requestid: <new GUID>`, `Content-Type: application/json` and the body of TC-BUG-57-01 step 1 with `"cardTypeId":3`.
2. Poll `GET /api/orders?api-version=1.0` with alice's token until it returns N + 1 orders (at most 30 s).

## Expected result

- Step 1 answers HTTP 200 OK, not 400 and not 500.
- Step 2 returns N + 1 orders for alice; the new order has `total` 199.99.
