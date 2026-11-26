---
id: TC-CART-1-02
type: happy
layer: unit
covers: ["AC3", "Move to cart button: moves the saved product, with its quantity, back to the cart"]
priority: P1
---

# TC-CART-1-02: MoveToCart puts the saved product, with its quantity, into an empty cart

## Why

- AC3: the quantity must survive the move and the saved list must be left without the product. Unit layer, mocked repository.

## Preconditions

- Layer: MSTest in `tests/Basket.UnitTests/BasketServiceTests.cs`; `BasketService` built with `Substitute.For<IBasketRepository>()` and `NullLogger<BasketService>.Instance`; `CreateContext("user-1")` gives the authenticated caller `user-1`.
- `GetBasketAsync("user-1")` returns a basket with Items [] and SavedItems [product 1 x 2]. `UpdateBasketAsync` echoes its argument.

## Steps

1. Call `service.MoveToCart(new MoveToCartRequest { ProductId = 1 }, CreateContext("user-1"))`.

## Expected result

- The response `Items` is exactly [product 1 x 2] and `SavedItems` is empty.
- `UpdateBasketAsync` was called once with Items [product 1 x 2] and SavedItems [].
