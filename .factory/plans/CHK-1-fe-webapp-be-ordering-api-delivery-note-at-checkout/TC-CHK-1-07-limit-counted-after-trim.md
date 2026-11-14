---
id: TC-CHK-1-07
type: happy
layer: functional
covers: ["Open Questions answer: counted after trimming", "AC5"]
priority: P1
---

# TC-CHK-1-07: A 200-character note padded with whitespace is accepted and trimmed

## Why

- The resolved open question says the limit applies after trimming; a padded note longer than 200 raw characters must pass. Separate from TC-CHK-1-06 because it checks the order of trim and length check.

## Preconditions

- Default scenario on the functional fixture; user `alice` with a bearer token; no orders exist for alice.
- Request body B (from `_index.md`) with `deliveryNote` set as stated in the steps; header `x-requestid` set to a fresh GUID.

## Steps

1. `POST /api/orders?api-version=1.0` as alice with body B and `deliveryNote` = 5 spaces + the character `a` repeated 200 times + 5 spaces (210 raw characters).
2. `GET /api/orders` with `api-version=1.0` as alice; take `ordernumber` of the single entry as `<orderId>`.
3. `GET /api/orders/<orderId>?api-version=1.0` as alice.

## Expected result

- Step 1 returns 200.
- Step 3 returns 200 and `deliveryNote` equals the 200 `a` characters (no surrounding spaces).
