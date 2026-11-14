---
id: TC-BUG-8-06
type: sad
sad-path: validation
layer: unit
covers: ["Decisions: all invalid items reported in one INVALID_ARGUMENT message"]
priority: P2
---

# TC-BUG-8-06: The INVALID_ARGUMENT message names every invalid product

## Why

- The implementation notes state all invalid items are reported in one message in request order; the caller needs this to fix the request.

## Preconditions

- Authenticated caller alice.
- IBasketRepository is a mock.

## Steps

1. Call `BasketService.UpdateBasket` with items `{productId: 7, quantity: -3}` and `{productId: 6, quantity: 0}`.

## Expected result

- `RpcException.Status.StatusCode` is `InvalidArgument`.
- `RpcException.Status.Detail` equals `Invalid number of units for product 7: quantity -3; Invalid number of units for product 6: quantity 0`.
