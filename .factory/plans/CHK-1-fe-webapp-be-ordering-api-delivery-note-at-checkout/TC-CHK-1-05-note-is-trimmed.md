---
id: TC-CHK-1-05
type: happy
layer: functional
covers: ["AC4", "Outputs: the trimmed note as placed"]
priority: P1
---

# TC-CHK-1-05: Surrounding whitespace is trimmed from the stored note

## Why

- AC4: the output promises the trimmed note, so the API must trim even when the WebApp is bypassed.

## Preconditions

- Default scenario on the functional fixture; user `alice` with a bearer token; no orders exist for alice.
- Request body B (from `_index.md`) with `deliveryNote` set as stated in the steps; header `x-requestid` set to a fresh GUID.

## Steps

1. `POST /api/orders?api-version=1.0` as alice with body B and `"deliveryNote": "  Ring twice  "`.
2. `GET /api/orders` with `api-version=1.0` as alice; take `ordernumber` of the single entry as `<orderId>`.
3. `GET /api/orders/<orderId>?api-version=1.0` as alice.

## Expected result

- Step 1 returns 200.
- Step 3 returns 200 and `deliveryNote` equals `Ring twice` (no leading or trailing spaces).
