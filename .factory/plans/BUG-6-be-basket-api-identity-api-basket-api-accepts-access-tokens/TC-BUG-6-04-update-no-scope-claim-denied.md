---
id: TC-BUG-6-04
type: sad
sad-path: auth
layer: functional
covers: ["Decisions: BasketScope = authenticated user whose scope claims contain basket"]
priority: P1
---

# TC-BUG-6-04: UpdateBasket from an authenticated principal with no scope claim is denied

## Why

- The policy must require the scope, not just the absence of a wrong one: a token with no `scope` claim at all (e.g. an identity-only token) is authenticated yet must not write. Separate from TC-BUG-6-03 because the scope lookup handles an empty claim set differently from a non-matching one.

## Preconditions

- Basket.API hosted in-process (`WebApplicationFactory<Program>`) against the Redis container from `RedisFixture`; the JWT bearer scheme is replaced by a test authentication handler that, when the request carries test headers, issues an authenticated principal with claim `sub` = the given user id and the given `scope` claims, and returns no result when the headers are absent. The gRPC client uses the factory's handler (`GrpcChannel.ForAddress(server.BaseAddress, new() { HttpHandler = server.CreateHandler() })`).
- Redis has no key `/basket/user-bug6-04`.
- Caller principal: `sub` = `user-bug6-04`, no `scope` claim.

## Steps

1. gRPC `UpdateBasket` as the caller with `{ items: [{ product_id: 99, quantity: 1 }] }`.
2. `RedisBasketRepository.GetBasketAsync("user-bug6-04")`.

## Expected result

- Step 1 throws `RpcException` with `StatusCode.PermissionDenied`.
- Step 2 returns `null` (no basket stored).
