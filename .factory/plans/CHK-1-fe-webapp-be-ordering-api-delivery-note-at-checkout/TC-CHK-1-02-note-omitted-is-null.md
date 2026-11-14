---
id: TC-CHK-1-02
type: happy
layer: functional
covers: ["AC2", "Inputs: deliveryNote not required"]
priority: P1
---

# TC-CHK-1-02: Order placed without deliveryNote has deliveryNote null

## Why

- AC2 and backward compatibility: existing API 1.0 clients omit the field entirely, which must still work and read back as null.

## Preconditions

- Default scenario on the functional fixture; user `alice` with a bearer token; no orders exist for alice.
- Request body B (from `_index.md`) with `deliveryNote` set as stated in the steps; header `x-requestid` set to a fresh GUID.

## Steps

1. `POST /api/orders?api-version=1.0` as alice with body B and no `deliveryNote` property.
2. `GET /api/orders` with `api-version=1.0` as alice; take `ordernumber` of the single entry as `<orderId>`.
3. `GET /api/orders/<orderId>?api-version=1.0` as alice.

## Expected result

- Step 1 returns 200.
- Step 3 returns 200; the JSON has a `deliveryNote` property whose value is `null`.
