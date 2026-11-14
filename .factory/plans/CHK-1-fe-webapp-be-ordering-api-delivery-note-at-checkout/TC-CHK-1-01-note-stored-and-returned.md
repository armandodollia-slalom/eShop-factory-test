---
id: TC-CHK-1-01
type: happy
layer: functional
covers: ["AC1", "Outputs: GET /api/orders/{orderId} deliveryNote"]
priority: P1
---

# TC-CHK-1-01: Delivery note is stored and returned by GET /api/orders/{orderId}

## Why

- AC1 is the core behavior; a functional test reaches the real persistence and query path (migration, aggregate, view model) that a unit test would mock.

## Preconditions

- Default scenario on the functional fixture; user `alice` with a bearer token; no orders exist for alice.
- Request body B (from `_index.md`) with `deliveryNote` set as stated in the steps; header `x-requestid` set to a fresh GUID.

## Steps

1. `POST /api/orders?api-version=1.0` as alice with body B and `"deliveryNote": "Leave at the back door"`.
2. `GET /api/orders` with `api-version=1.0` as alice; take `ordernumber` of the single entry as `<orderId>`.
3. `GET /api/orders/<orderId>?api-version=1.0` as alice.

## Expected result

- Step 1 returns 200.
- Step 2 returns exactly one entry.
- Step 3 returns 200 and `deliveryNote` equals `Leave at the back door`.
