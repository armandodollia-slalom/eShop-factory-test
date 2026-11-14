---
id: TC-BUG-6-06
type: happy
layer: functional
covers: ["Decisions: scope matching handles one scope claim per scope (JSON array)", "Code map: Token with basket scope works as before"]
priority: P0
---

# TC-BUG-6-06: UpdateBasket with one scope claim per scope including basket succeeds

## Why

- Identity.API emits several scopes as separate `scope` claims; the WebApp's token carries `openid profile orders basket ...`. If the policy only looked at the first claim, the WebApp could no longer write baskets. Placing `basket` last among several claims checks every claim is examined.

## Preconditions

- Basket.API hosted in-process (`WebApplicationFactory<Program>`) against the Redis container from `RedisFixture`; the JWT bearer scheme is replaced by a test authentication handler that, when the request carries test headers, issues an authenticated principal with claim `sub` = the given user id and the given `scope` claims, and returns no result when the headers are absent. The gRPC client uses the factory's handler (`GrpcChannel.ForAddress(server.BaseAddress, new() { HttpHandler = server.CreateHandler() })`).
- Redis has no key `/basket/user-bug6-06`.
- Caller principal: `sub` = `user-bug6-06`, three separate claims `scope` = `openid`, `scope` = `orders`, `scope` = `basket`.

## Steps

1. gRPC `UpdateBasket` as the caller with `{ items: [{ product_id: 99, quantity: 2 }] }`.
2. `RedisBasketRepository.GetBasketAsync("user-bug6-06")`.

## Expected result

- Step 1 returns `OK` with `items` = `[{ product_id: 99, quantity: 2 }]`.
- Step 2 returns a basket with `BuyerId` `user-bug6-06` and exactly one item, `ProductId` 99, `Quantity` 2.
