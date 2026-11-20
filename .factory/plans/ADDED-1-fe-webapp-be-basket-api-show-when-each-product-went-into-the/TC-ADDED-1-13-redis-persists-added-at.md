---
id: TC-ADDED-1-13
type: happy
layer: functional
covers: ["AC4: the Basket API keeps the time a product was first added for every line and returns it with the basket"]
priority: P1
---

# TC-ADDED-1-13: UpdateBasket over gRPC persists the server-assigned added_at and GetBasket returns it exactly

## Why

- AC4 "keeps the time ... and returns it": the server-assigned time must survive the gRPC mapping, serialization to Redis and back with its instant intact, or later reads show a shifted or missing date. Needs the Basket API host against a real Redis; the unit cases mock the repository.

## Preconditions

- `Basket.FunctionalTests` `RedisFixture` running a real Redis; no value at `/basket/<buyer id>`.
- Basket.API hosted in-process (`WebApplicationFactory<Program>`) with its Redis connection pointed at the fixture's Redis, the registered `TimeProvider` replaced by a fake fixed at `2026-11-01T09:00:00.123Z`, and an authentication handler that authenticates every call with claim `sub` = `buyer-<new guid>`.

## Steps

1. Through a gRPC `Basket.BasketClient` on the host's HTTP handler, call `UpdateBasket` with items `[{product_id: 99, quantity: 1}]` (no `added_at`).
2. Call `GetBasket` with an empty `GetBasketRequest`.

## Expected result

- Step 1 completes with status `OK`; its response item 99 has `added_at` `2026-11-01T09:00:00.123Z`.
- Step 2 completes with status `OK` and returns one item: `product_id` 99, `quantity` 1, `added_at` equal to `Timestamp` `2026-11-01T09:00:00.123Z` (same seconds and nanos).
- The raw Redis JSON at `/basket/<buyer id>` contains an `AddedAt` value for product 99 that is the UTC instant `2026-11-01T09:00:00.123Z`.
