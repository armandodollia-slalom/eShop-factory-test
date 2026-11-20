---
id: TC-ADDED-1-16
type: sad
sad-path: concurrency
layer: functional
covers: ["AC3: removed and added again gets the date it was added again", "Implementation Notes: optimistic Redis transaction re-reads and recomputes on conflict"]
kept-for: sol-1
priority: P1
---

# TC-ADDED-1-16: The Redis conditional update retries against a basket written between its read and its write

## Why

- Upheld finding sol-1: the protection in TC-ADDED-1-14 only holds if the real Redis transaction detects a write made between its read and its write and re-runs the service's update on the new value. A substitute cannot prove the Redis condition; only real Redis behind the hosted gRPC service can. The concurrent write is placed deterministically inside the update by a test repository wrapper registered in the host, so the case exercises `UpdateBasket` and `GetBasket` over gRPC rather than calling the repository directly.

## Preconditions

- `Basket.FunctionalTests` `RedisFixture` running a real Redis; buyer id `buyer-<new guid>`.
- Basket.API hosted in-process (`WebApplicationFactory<Program>`) as in TC-ADDED-1-13: Redis connection pointed at the fixture's Redis, `TimeProvider` replaced by a fake fixed at `2026-11-25T08:00:00Z`, and an authentication handler that authenticates every call with claim `sub` = the buyer id.
- The host's `IBasketRepository` registration replaced by a test wrapper around the real `RedisBasketRepository`. Its `UpdateBasketAsync(buyerId, update)` passes the inner repository a wrapped function that, on each call, records `stored.Items[0].AddedAt` and, on its first call only, writes `[{ProductId 99, Quantity 1, AddedAt 2026-11-20T10:00:00Z}]` for the buyer with the inner repository's `UpdateBasketAsync(basket)` (a concurrent remove + re-add), then returns `update(stored)`. All other members delegate unchanged.
- Stored basket for the buyer, written through the inner repository's `UpdateBasketAsync(basket)` before the call: `[{ProductId 99, Quantity 1, AddedAt 2026-11-01T09:00:00Z}]`.

## Steps

1. Through a gRPC `Basket.BasketClient` on the host's HTTP handler, call `UpdateBasket` with items `[{product_id: 99, quantity: 3}]` (no `added_at`).
2. Call `GetBasket` with an empty `GetBasketRequest`.

## Expected result

- The wrapped update function was called exactly twice; the stored AddedAt values it saw are `2026-11-01T09:00:00Z` then `2026-11-20T10:00:00Z`.
- The inner repository's `UpdateBasketAsync(buyerId, update)` returned without throwing.
- Step 1 completes with status `OK`; its response has one item: `product_id` 99, `quantity` 3, `added_at` `2026-11-20T10:00:00Z`.
- Step 2 completes with status `OK` and returns one item: `product_id` 99, `quantity` 3, `added_at` `2026-11-20T10:00:00Z`.
- Neither response has `added_at` `2026-11-01T09:00:00Z` (the date read before the conflict) or `2026-11-25T08:00:00Z` (the fake clock).
