---
id: TC-BUG-8-07
type: sad
sad-path: auth
layer: unit
covers: ["Decisions: validation runs after the auth check"]
priority: P2
---

# TC-BUG-8-07: An anonymous caller with an invalid quantity gets UNAUTHENTICATED

## Why

- Pins the ordering stated in the story: auth check first, then validation, so unauthenticated callers do not learn validation details.

## Preconditions

- ServerCallContext has no user identity.
- IBasketRepository is a mock.

## Steps

1. Call `BasketService.UpdateBasket` with the single item `{productId: 7, quantity: -3}`.

## Expected result

- `RpcException` with `StatusCode.Unauthenticated` is thrown.
- `UpdateBasketAsync` is never called.
