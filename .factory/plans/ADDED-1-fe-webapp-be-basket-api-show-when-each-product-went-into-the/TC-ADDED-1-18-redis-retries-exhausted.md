---
id: TC-ADDED-1-18
type: sad
sad-path: concurrency
layer: functional
covers: ["AC3: a stale timestamp is never written", "Implementation Notes: up to 10 attempts, then the update is abandoned"]
kept-for: sol-3
priority: P2
---

# TC-ADDED-1-18: The Redis conditional update gives up after 10 conflicting attempts and leaves the concurrent basket in place

## Why

- Upheld finding sol-3: retry exhaustion must end in `BasketConcurrencyException`, reported to the gRPC caller as `Aborted`, and must not fall back to an unconditional write that overwrites the competing basket with stale data. Only real Redis behind the hosted gRPC service proves the condition fails on every attempt, that nothing is written and what status the client sees; a test repository wrapper in the host makes every attempt conflict deterministically.

## Preconditions

- `Basket.FunctionalTests` `RedisFixture` running a real Redis; buyer id `buyer-<new guid>`.
- Basket.API hosted in-process (`WebApplicationFactory<Program>`) as in TC-ADDED-1-13: Redis connection pointed at the fixture's Redis, `TimeProvider` replaced by a fake fixed at `2026-11-25T08:00:00Z`, and an authentication handler that authenticates every call with claim `sub` = the buyer id.
- The host's `IBasketRepository` registration replaced by a test wrapper around the real `RedisBasketRepository`. Its `UpdateBasketAsync(buyerId, update)` passes the inner repository a wrapped function that, on call number N, first writes `[{ProductId 99, Quantity N + 1, AddedAt 2026-11-20T10:00:00Z}]` for the buyer with the inner repository's `UpdateBasketAsync(basket)` (a concurrent write), then returns `update(stored)`; the wrapper counts the calls and records any exception the inner repository throws before rethrowing it. All other members delegate unchanged.
- Stored basket for the buyer, written through the inner repository's `UpdateBasketAsync(basket)` before the call: `[{ProductId 99, Quantity 1, AddedAt 2026-11-01T09:00:00Z}]`.

## Steps

1. Through a gRPC `Basket.BasketClient` on the host's HTTP handler, call `UpdateBasket` with items `[{product_id: 99, quantity: 100}]` (no `added_at`).
2. Call `GetBasket` with an empty `GetBasketRequest`.

## Expected result

- The wrapped update function was called exactly 10 times.
- The inner repository's `UpdateBasketAsync(buyerId, update)` threw `BasketConcurrencyException`.
- Step 1 fails with `RpcException` status `Aborted` (not `NotFound`).
- Step 2 completes with status `OK` and returns the last concurrent write: one item, `product_id` 99, `quantity` 11, `added_at` `2026-11-20T10:00:00Z`; `quantity` is not 100 and `added_at` is neither `2026-11-01T09:00:00Z` nor `2026-11-25T08:00:00Z`.
