---
id: TC-BUG-6-07
type: happy
layer: functional
covers: ["Decisions: scope matching handles a single space-separated value"]
priority: P1
---

# TC-BUG-6-07: UpdateBasket with one space-separated scope value including basket succeeds

## Why

- The decision explicitly supports a single `scope` claim holding `"openid orders basket"` (how a JWT handler maps an OAuth `scope` string when it does not split it into one claim per scope). A plain equality check would reject it and lock out such callers.

## Preconditions

- Basket.API hosted in-process (`WebApplicationFactory<Program>`) against the Redis container from `RedisFixture`; the JWT bearer scheme is replaced by a test authentication handler that, when the request carries test headers, issues an authenticated principal with claim `sub` = the given user id and the given `scope` claims, and returns no result when the headers are absent. The gRPC client uses the factory's handler (`GrpcChannel.ForAddress(server.BaseAddress, new() { HttpHandler = server.CreateHandler() })`).
- Redis has no key `/basket/user-bug6-07`.
- Caller principal: `sub` = `user-bug6-07`, one claim `scope` = `openid orders basket`.

## Steps

1. gRPC `UpdateBasket` as the caller with `{ items: [{ product_id: 99, quantity: 3 }] }`.
2. `RedisBasketRepository.GetBasketAsync("user-bug6-07")`.

## Expected result

- Step 1 returns `OK` with `items` = `[{ product_id: 99, quantity: 3 }]`.
- Step 2 returns a basket with exactly one item, `ProductId` 99, `Quantity` 3.
