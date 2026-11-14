---
id: TC-BUG-8-03
type: sad
sad-path: boundary
layer: unit
covers: ["Expected: INVALID_ARGUMENT", "BasketItem.Validate Quantity < 1"]
priority: P2
---

# TC-BUG-8-03: A single line with quantity -1 is rejected

## Why

- Negative side of the boundary, nearest value to zero; confirms the check is not limited to the -3 value from the report.

## Preconditions

- Authenticated caller alice.
- IBasketRepository is a mock.

## Steps

1. Call `BasketService.UpdateBasket` with the single item `{productId: 7, quantity: -1}`.

## Expected result

- `RpcException` with `StatusCode.InvalidArgument` is thrown.
- `UpdateBasketAsync` is never called.
