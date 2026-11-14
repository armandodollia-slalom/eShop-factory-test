---
id: TC-CHK-1-04
type: happy
layer: functional
covers: ["AC3", "Inputs: only whitespace means no note"]
priority: P1
---

# TC-CHK-1-04: Whitespace-only deliveryNote is stored as null

## Why

- AC3: a note of only spaces must not be persisted as a blank string; separate from the empty case because trimming is what turns it into null.

## Preconditions

- Default scenario on the functional fixture; user `alice` with a bearer token; no orders exist for alice.
- Request body B (from `_index.md`) with `deliveryNote` set as stated in the steps; header `x-requestid` set to a fresh GUID.

## Steps

1. `POST /api/orders?api-version=1.0` as alice with body B and `"deliveryNote": "     "` (5 spaces).
2. `GET /api/orders` with `api-version=1.0` as alice; take `ordernumber` of the single entry as `<orderId>`.
3. `GET /api/orders/<orderId>?api-version=1.0` as alice.

## Expected result

- Step 1 returns 200.
- Step 3 returns 200 and `deliveryNote` is `null`.
