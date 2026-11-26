---
id: TC-BUG-6-05
type: sad
sad-path: auth
layer: functional
covers: ["Decisions: DeleteBasket rejected by the gRPC authorization middleware before the handler runs", "Code map: Token without basket scope rejected on DeleteBasket"]
priority: P0
---

# TC-BUG-6-05: DeleteBasket with scope "orders" only is denied and the basket stays in Redis

## Why

- The decision applies the policy at class level so `DeleteBasket` is protected too; without it a token for another API could empty a user's basket. Its own case because it is a different RPC and a different Redis effect (delete, not write).

## Preconditions

- Basket.API hosted in-process (`WebApplicationFactory<Program>`) against the Redis container from `RedisFixture`; the JWT bearer scheme is replaced by a test authentication handler that, when the request carries test headers, issues an authenticated principal with claim `sub` = the given user id and the given `scope` claims, and returns no result when the headers are absent. The gRPC client uses the factory's handler (`GrpcChannel.ForAddress(server.BaseAddress, new() { HttpHandler = server.CreateHandler() })`).
- Redis key `/basket/user-bug6-05` holds a basket with items `[{ ProductId: 1, Quantity: 1 }]`.
- Caller principal: `sub` = `user-bug6-05`, one claim `scope` = `orders`.

## Steps

1. gRPC `DeleteBasket` as the caller with `{}`.
2. `RedisBasketRepository.GetBasketAsync("user-bug6-05")`.

## Expected result

- Step 1 throws `RpcException` with `StatusCode.PermissionDenied`.
- Step 2 returns a basket with exactly one item, `ProductId` 1, `Quantity` 1.
