---
id: TC-CHK-1-03
type: happy
layer: functional
covers: ["AC2", "Inputs: Empty means no note"]
priority: P2
---

# TC-CHK-1-03: Empty-string deliveryNote is stored as null

## Why

- The story says empty means no note; an explicit empty string is a distinct input from an omitted field and goes through the normalization in the command.

## Preconditions

- Default scenario on the functional fixture; user `alice` with a bearer token; no orders exist for alice.
- Request body B (from `_index.md`) with `deliveryNote` set as stated in the steps; header `x-requestid` set to a fresh GUID.

## Steps

1. `POST /api/orders?api-version=1.0` as alice with body B and `"deliveryNote": ""`.
2. `GET /api/orders` with `api-version=1.0` as alice; take `ordernumber` of the single entry as `<orderId>`.
3. `GET /api/orders/<orderId>?api-version=1.0` as alice.

## Expected result

- Step 1 returns 200.
- Step 3 returns 200 and `deliveryNote` is `null` (not `""`).
