---
id: TC-BUG-6-03
type: sad
sad-path: auth
layer: functional
covers: ["Expected: rejected; nothing is written to Redis", "Code map: Token without basket scope rejected on UpdateBasket"]
priority: P0
---

# TC-BUG-6-03: UpdateBasket with scope "orders" only is denied and Redis is unchanged

## Why

- Protects the core of the bug: a token for another API must not write a basket. Unlike the e2e case, this layer can read Redis directly and prove that an existing basket is not overwritten (the policy runs before the handler), which is the "nothing is written to Redis" half of Expected.

## Preconditions

- Basket.API hosted in-process (`WebApplicationFactory<Program>`) against the Redis container from `RedisFixture`; the JWT bearer scheme is replaced by a test authentication handler that, when the request carries test headers, issues an authenticated principal with claim `sub` = the given user id and the given `scope` claims, and returns no result when the headers are absent. The gRPC client uses the factory's handler (`GrpcChannel.ForAddress(server.BaseAddress, new() { HttpHandler = server.CreateHandler() })`).
- Redis key `/basket/user-bug6-03` holds a basket for buyer `user-bug6-03` with items `[{ ProductId: 1, Quantity: 1 }]`, written through `RedisBasketRepository.UpdateBasketAsync`.
- Caller principal: `sub` = `user-bug6-03`, one claim `scope` = `orders`.

## Steps

1. gRPC `UpdateBasket` as the caller with `{ items: [{ product_id: 99, quantity: 5 }] }`.
2. Read the basket for `user-bug6-03` with `RedisBasketRepository.GetBasketAsync("user-bug6-03")`.

## Expected result

- Step 1 throws `RpcException` with `StatusCode.PermissionDenied`.
- Step 2 returns a basket with exactly one item, `ProductId` 1, `Quantity` 1 (no item with `ProductId` 99).
