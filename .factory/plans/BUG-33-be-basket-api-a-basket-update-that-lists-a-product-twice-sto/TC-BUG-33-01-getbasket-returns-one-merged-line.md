---
id: TC-BUG-33-01
type: happy
layer: functional
covers: ["Expected: The basket holds one line for product 1, with quantity 3", "Expected: GetBasket returns that one line", "Steps to Reproduce: steps 2 and 3"]
priority: P1
---

# TC-BUG-33-01: GetBasket after an update listing product 1 twice (1 + 2) returns one line with quantity 3

## Why

- This is the bug as reported: two entries for product 1 were stored as two lines and `GetBasket` returned both. It reads back through `GetBasket` after the update so it proves what Redis holds, not only what the mapper returned. Functional (service over the real `RedisBasketRepository` and Redis) is the cheapest layer that includes persistence; a mocked repository would not show what is stored.

## Preconditions

- `RedisFixture` Redis is running; `BasketService` is constructed with `new RedisBasketRepository(NullLogger<RedisBasketRepository>.Instance, fixture.Connection)` and `NullLogger<BasketService>.Instance`.
- Buyer id `bug33-tc01-bob`; no basket is stored for it (call `DeleteBasketAsync("bug33-tc01-bob")` first).
- The `ServerCallContext` carries an `HttpContext` (user state `__HttpContext`) whose user has the claim `sub` = `bug33-tc01-bob`.

## Steps

1. Call `UpdateBasket` with `UpdateBasketRequest { items: [ { product_id: 1, quantity: 1 }, { product_id: 1, quantity: 2 } ] }` and the context above.
2. Call `GetBasket` with `GetBasketRequest {}` and the same context.

## Expected result

- Step 1 completes without an `RpcException`.
- Step 2 returns a `CustomerBasketResponse` with exactly 1 item: `product_id` = 1, `quantity` = 3.
- No item with `quantity` = 1 or `quantity` = 2 for product 1 is returned.
- `RedisBasketRepository.GetBasketAsync("bug33-tc01-bob")` returns a basket whose `Items` has exactly 1 entry: `ProductId` = 1, `Quantity` = 3.
