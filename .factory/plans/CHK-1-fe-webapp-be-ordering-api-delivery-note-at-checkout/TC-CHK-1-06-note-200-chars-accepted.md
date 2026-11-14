---
id: TC-CHK-1-06
type: happy
layer: functional
covers: ["AC5", "Inputs: at most 200 characters"]
priority: P1
---

# TC-CHK-1-06: A note of exactly 200 characters is accepted

## Why

- AC5: the upper boundary just inside the limit; an off-by-one (< 200) would reject it.

## Preconditions

- Default scenario on the functional fixture; user `alice` with a bearer token; no orders exist for alice.
- Request body B (from `_index.md`) with `deliveryNote` set as stated in the steps; header `x-requestid` set to a fresh GUID.

## Steps

1. `POST /api/orders?api-version=1.0` as alice with body B and `deliveryNote` = the character `a` repeated 200 times.
2. `GET /api/orders` with `api-version=1.0` as alice; take `ordernumber` of the single entry as `<orderId>`.
3. `GET /api/orders/<orderId>?api-version=1.0` as alice.

## Expected result

- Step 1 returns 200.
- Step 3 returns 200 and `deliveryNote` equals the same 200-character string.
