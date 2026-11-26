---
id: TC-BUG-6-10
type: happy
layer: functional
covers: ["Code map: Token with basket scope works as before (DeleteBasket)"]
priority: P1
---

# TC-BUG-6-10: DeleteBasket with the basket scope removes the caller's basket

## Why

- The class-level policy also covers `DeleteBasket`; the WebApp empties the basket after checkout with a basket-scoped token. If the policy wrongly denied it, baskets would never clear.

## Preconditions

- Basket.API hosted in-process (`WebApplicationFactory<Program>`) against the Redis container from `RedisFixture`; the JWT bearer scheme is replaced by a test authentication handler that, when the request carries test headers, issues an authenticated principal with claim `sub` = the given user id and the given `scope` claims, and returns no result when the headers are absent. The gRPC client uses the factory's handler (`GrpcChannel.ForAddress(server.BaseAddress, new() { HttpHandler = server.CreateHandler() })`).
- Redis key `/basket/user-bug6-10` holds a basket with items `[{ ProductId: 1, Quantity: 1 }]`.
- Caller principal: `sub` = `user-bug6-10`, one claim `scope` = `basket`.

## Steps

1. gRPC `DeleteBasket` as the caller with `{}`.
2. `RedisBasketRepository.GetBasketAsync("user-bug6-10")`.

## Expected result

- Step 1 returns `OK` with an empty `DeleteBasketResponse`.
- Step 2 returns `null`.
