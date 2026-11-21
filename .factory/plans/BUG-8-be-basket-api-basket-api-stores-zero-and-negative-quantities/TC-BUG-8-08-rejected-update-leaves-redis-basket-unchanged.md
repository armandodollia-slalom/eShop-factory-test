---
id: TC-BUG-8-08
type: sad
sad-path: validation
layer: functional
covers: ["Expected: Redis is unchanged", "Actual: both lines stored in Redis"]
priority: P1
---

# TC-BUG-8-08: A rejected update leaves the existing Redis basket untouched

## Why

- The bug is about persisted state in Redis; a real Redis (RedisFixture) proves nothing is written, which a mocked repository cannot. Functional layer in tests/Basket.FunctionalTests.

## Preconditions

- Redis from `RedisFixture`, flushed of key "alice".
- `BasketService` built in-process with the real `RedisBasketRepository` on that Redis.
- Seed: alice's basket saved via `UpdateBasket` with item `{productId: 5, quantity: 2}`.

## Steps

1. Call `BasketService.UpdateBasket` as alice with items `{productId: 7, quantity: -3}` and `{productId: 6, quantity: 0}`.
2. Call `BasketService.GetBasket` as alice.

## Expected result

- Step 1 throws `RpcException` with `StatusCode.InvalidArgument`.
- Step 2 returns exactly one item `{productId: 5, quantity: 2}`; products 7 and 6 are absent.
