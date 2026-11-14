---
id: TC-BUG-8-05
type: sad
sad-path: validation
layer: unit
covers: ["Expected: Redis is unchanged", "Decisions: validation before any repository call"]
priority: P1
---

# TC-BUG-8-05: One invalid line among valid lines rejects the whole update

## Why

- The basket must not be partially saved; a regression that skips only bad lines would silently change the basket.

## Preconditions

- Authenticated caller alice.
- IBasketRepository is a mock.

## Steps

1. Call `BasketService.UpdateBasket` with items `{productId: 1, quantity: 2}`, `{productId: 7, quantity: -3}`, `{productId: 3, quantity: 5}`.

## Expected result

- `RpcException` with `StatusCode.InvalidArgument` is thrown.
- `UpdateBasketAsync` is never called.
