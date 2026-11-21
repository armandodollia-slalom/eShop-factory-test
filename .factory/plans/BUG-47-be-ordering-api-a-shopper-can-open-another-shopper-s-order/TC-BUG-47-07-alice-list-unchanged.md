---
id: TC-BUG-47-07
type: happy
layer: e2e
covers: ["Expected: GET /api/orders (the signed-in shopper's list) works exactly as today"]
priority: P2
---

# TC-BUG-47-07: alice's order list still lists only her orders, including A

## Why

- The story requires the list endpoint to be unchanged. It shares the query class with the fixed endpoint, so a regression there would hide orders from their owner or mix in others'.

## Preconditions

- Scenario `bug-47` on the test stack; orders `A` (alice) and `B` (bob) placed (see `_index.md`).
- An access token for `alice` with scope `orders` from client `orderingswaggerui`.

## Steps

1. As alice: `GET /api/orders?api-version=1.0` with header `Authorization: Bearer <alice's token>`.

## Expected result

- Status is `200`; the body is a JSON array.
- The array contains an entry with `orderNumber` = `<A>` and `total` = 10.
- The array contains no entry with `orderNumber` = `<B>`.
