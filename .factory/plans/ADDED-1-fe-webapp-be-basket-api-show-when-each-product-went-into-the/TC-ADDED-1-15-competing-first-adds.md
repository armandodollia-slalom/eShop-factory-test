---
id: TC-ADDED-1-15
type: sad
sad-path: concurrency
layer: unit
covers: ["AC4: keeps the time a product was first added", "AC2: add more of it, date does not change", "Implementation Notes: product id not in the stored basket gets the current UTC time"]
kept-for: sol-1
priority: P2
---

# TC-ADDED-1-15: Of two competing first adds of a product, the first committed time is kept

## Why

- Upheld finding sol-1 also names competing first additions: two requests that both saw no product 99 must not let the later one overwrite the time the earlier one committed, or the "first added" time moves forward (AC4, AC2). The unit layer makes the race deterministic with a repository substitute that calls the update function again after a concurrent write.

## Preconditions

- `BasketService` with a fake `TimeProvider` fixed at `2026-11-20T10:00:05Z`; caller `buyer-1`.
- Stored basket for `buyer-1`: `null` (no basket yet).
- Repository substitute whose `UpdateBasketAsync("buyer-1", update)`:
  1. calls `update` with `null` and discards the result (its conditional "key absent" write conflicts);
  2. sets the stored basket, as the competing request committed it, to `[{ProductId 99, Quantity 1, AddedAt 2026-11-20T10:00:00Z}]`;
  3. calls `update` again with that stored basket, saves the result and returns it.

## Steps

1. Call `UpdateBasket` with items `[{product_id: 99, quantity: 2}]`.

## Expected result

- The call completes with no `RpcException`.
- The first call of `update` (stored basket `null`) produced product 99 with AddedAt `2026-11-20T10:00:05Z`; that result is not saved.
- The saved basket has one item: ProductId 99, Quantity 2, AddedAt `2026-11-20T10:00:00Z`.
- The response item 99 has `added_at` `2026-11-20T10:00:00Z`, not `2026-11-20T10:00:05Z`.
