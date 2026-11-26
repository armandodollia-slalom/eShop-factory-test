---
id: TC-BUG-6-11
type: happy
layer: functional
covers: ["Decisions: GetBasket keeps [AllowAnonymous]", "Code map: Anonymous GetBasket returns an empty basket"]
priority: P1
---

# TC-BUG-6-11: Anonymous GetBasket still returns an empty basket

## Why

- The policy is applied at class level, so `[AllowAnonymous]` on `GetBasket` is the only thing keeping anonymous reads working (the WebApp calls it before sign-in). If it were lost, anonymous visitors would get an error instead of an empty cart.

## Preconditions

- Basket.API hosted in-process (`WebApplicationFactory<Program>`) against the Redis container from `RedisFixture`; the JWT bearer scheme is replaced by a test authentication handler that, when the request carries test headers, issues an authenticated principal with claim `sub` = the given user id and the given `scope` claims, and returns no result when the headers are absent. The gRPC client uses the factory's handler (`GrpcChannel.ForAddress(server.BaseAddress, new() { HttpHandler = server.CreateHandler() })`).
- No test authentication headers on the call.

## Steps

1. gRPC `GetBasket` with no authorization metadata and body `{}`.

## Expected result

- Step 1 returns `OK` with `items` empty (0 items).
