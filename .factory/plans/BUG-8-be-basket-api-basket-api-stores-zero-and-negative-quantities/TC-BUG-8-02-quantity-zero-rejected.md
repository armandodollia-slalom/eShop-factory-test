---
id: TC-BUG-8-02
type: sad
sad-path: boundary
layer: unit
covers: ["Expected: INVALID_ARGUMENT", "BasketItem.Validate Quantity < 1"]
priority: P1
---

# TC-BUG-8-02: A single line with quantity 0 is rejected

## Why

- Zero is the boundary just outside the valid range (Quantity < 1 is invalid); kept separate from negatives so an off-by-one (<= -1) would be caught.

## Preconditions

- Authenticated caller alice.
- IBasketRepository is a mock.

## Steps

1. Call `BasketService.UpdateBasket` with the single item `{productId: 6, quantity: 0}`.

## Expected result

- `RpcException` with `StatusCode.InvalidArgument` is thrown.
- `UpdateBasketAsync` is never called.
