---
id: TC-BUG-8-01
type: sad
sad-path: validation
layer: unit
covers: ["Expected: INVALID_ARGUMENT", "Technical Notes: validate in UpdateBasket"]
priority: P1
---

# TC-BUG-8-01: UpdateBasket with quantities -3 and 0 is rejected with INVALID_ARGUMENT and nothing is saved

## Why

- This is the exact reproduction in the bug report; if it broke, zero and negative lines would again reach Redis. Unit layer is the cheapest that checks the status code and that the repository is never called.

## Preconditions

- Authenticated caller alice (user identity "alice") in the ServerCallContext.
- IBasketRepository is a mock.

## Steps

1. Call `BasketService.UpdateBasket` with `UpdateBasketRequest` items `{productId: 7, quantity: -3}` and `{productId: 6, quantity: 0}`.

## Expected result

- An `RpcException` with `StatusCode.InvalidArgument` is thrown.
- `IBasketRepository.UpdateBasketAsync` is never called.
