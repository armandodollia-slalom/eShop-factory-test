---
id: TC-CHK-1-08
type: sad
sad-path: boundary
layer: functional
covers: ["AC7", "Outputs: 400 validation problem naming deliveryNote"]
priority: P1
---

# TC-CHK-1-08: A 201-character note is rejected with 400 and creates no order

## Why

- AC7: the boundary just outside the limit; the risk is an order being created or an error that does not name the field. Checked at API level so it does not depend on the WebApp validation.

## Preconditions

- Default scenario on the functional fixture; user `alice` with a bearer token; no orders exist for alice.
- Request body B (from `_index.md`) with `deliveryNote` set as stated in the steps; header `x-requestid` set to a fresh GUID.

## Steps

1. `POST /api/orders?api-version=1.0` as alice with body B and `deliveryNote` = the character `a` repeated 201 times.
2. `GET /api/orders?api-version=1.0` as alice.

## Expected result

- Step 1 returns 400 with `Content-Type: application/problem+json`; the `errors` object of the body contains the key `deliveryNote` (compared case-insensitively) with at least one message.
- Step 2 returns 200 with an empty list: no order was created.
