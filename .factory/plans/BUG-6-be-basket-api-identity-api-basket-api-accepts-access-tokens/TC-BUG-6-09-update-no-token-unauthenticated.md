---
id: TC-BUG-6-09
type: sad
sad-path: auth
layer: functional
covers: ["Decisions: BasketScope requires an authenticated user", "Expected: UNAUTHENTICATED"]
priority: P1
---

# TC-BUG-6-09: UpdateBasket without any token is rejected as unauthenticated

## Why

- Anonymous writes were already refused by the handler; now the class-level policy challenges them first. This guards that moving the check into the middleware still yields `UNAUTHENTICATED` for a missing token and still writes nothing.

## Preconditions

- Basket.API hosted in-process (`WebApplicationFactory<Program>`) against the Redis container from `RedisFixture`; the JWT bearer scheme is replaced by a test authentication handler that, when the request carries test headers, issues an authenticated principal with claim `sub` = the given user id and the given `scope` claims, and returns no result when the headers are absent. The gRPC client uses the factory's handler (`GrpcChannel.ForAddress(server.BaseAddress, new() { HttpHandler = server.CreateHandler() })`).
- No test authentication headers on the call (no principal).

## Steps

1. Count Redis keys matching `/basket/*` (`SCAN` with pattern `/basket/*`); call it N.
2. gRPC `UpdateBasket` with no authorization metadata and body `{ items: [{ product_id: 99, quantity: 1 }] }`.
3. Count Redis keys matching `/basket/*` again.

## Expected result

- Step 2 throws `RpcException` with `StatusCode.Unauthenticated`.
- Step 3 returns N (no key added).
