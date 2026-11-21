---
id: TC-BUG-6-08
type: sad
sad-path: boundary
layer: functional
covers: ["Decisions: scope claims contain basket (whole scope value, not a substring)"]
priority: P2
---

# TC-BUG-6-08: Scope value "baskets" does not satisfy the basket scope

## Why

- Boundary of the scope match: the policy requires the scope `basket`, so a different scope whose name merely contains it must not pass. A substring check (`Contains("basket")` on the raw value) would satisfy the space-separated case (TC-BUG-6-07) yet reopen the bug for any scope named like it.

## Preconditions

- Basket.API hosted in-process (`WebApplicationFactory<Program>`) against the Redis container from `RedisFixture`; the JWT bearer scheme is replaced by a test authentication handler that, when the request carries test headers, issues an authenticated principal with claim `sub` = the given user id and the given `scope` claims, and returns no result when the headers are absent. The gRPC client uses the factory's handler (`GrpcChannel.ForAddress(server.BaseAddress, new() { HttpHandler = server.CreateHandler() })`).
- Redis has no key `/basket/user-bug6-08`.
- Caller principal: `sub` = `user-bug6-08`, one claim `scope` = `openid baskets`.

## Steps

1. gRPC `UpdateBasket` as the caller with `{ items: [{ product_id: 99, quantity: 1 }] }`.
2. `RedisBasketRepository.GetBasketAsync("user-bug6-08")`.

## Expected result

- Step 1 throws `RpcException` with `StatusCode.PermissionDenied`.
- Step 2 returns `null`.
