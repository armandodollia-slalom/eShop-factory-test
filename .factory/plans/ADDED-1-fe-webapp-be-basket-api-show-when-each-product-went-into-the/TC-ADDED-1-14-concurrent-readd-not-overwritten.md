---
id: TC-ADDED-1-14
type: sad
sad-path: concurrency
layer: unit
covers: ["AC3: removed and added again gets the date it was added again", "AC2: date does not change", "Implementation Notes: UpdateBasket recomputes AddedAt on a conflicting write"]
kept-for: sol-1
priority: P1
---

# TC-ADDED-1-14: A quantity update that read the basket before a concurrent remove and re-add does not write back the old date

## Why

- Upheld finding sol-1: a quantity update that read the stored basket, then lost the race to a remove + re-add of the same product, must not write the stale first-added time back, or AC3's "date is the day I added it again" breaks. The unit layer drives the interleaving deterministically by making the repository substitute call the service's update function twice, as the real conditional write does on conflict.

## Preconditions

- `BasketService` with a fake `TimeProvider` fixed at `2026-11-25T08:00:00Z`; caller `buyer-1`.
- Stored basket for `buyer-1`: `[{ProductId 99, Quantity 1, AddedAt 2026-11-01T09:00:00Z}]`.
- Repository substitute whose `UpdateBasketAsync("buyer-1", update)`:
  1. calls `update` with the stored basket above and discards the result (its conditional write "conflicts");
  2. replaces the stored basket, as a concurrent request would, with `[{ProductId 99, Quantity 1, AddedAt 2026-11-20T10:00:00Z}]` (product 99 removed and added again);
  3. calls `update` again with that new stored basket, saves the result and returns it.

## Steps

1. Call `UpdateBasket` with items `[{product_id: 99, quantity: 3}]`.

## Expected result

- The call completes with no `RpcException`.
- The update function was called exactly twice.
- The saved basket has one item: ProductId 99, Quantity 3, AddedAt `2026-11-20T10:00:00Z`.
- The response item 99 has `quantity` 3 and `added_at` `2026-11-20T10:00:00Z`.
- Neither the saved nor the returned item has AddedAt `2026-11-01T09:00:00Z` (the date read before the conflict) or `2026-11-25T08:00:00Z` (the fake clock).
