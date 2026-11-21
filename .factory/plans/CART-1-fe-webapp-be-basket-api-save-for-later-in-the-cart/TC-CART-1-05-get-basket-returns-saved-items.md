---
id: TC-CART-1-05
type: happy
layer: unit
covers: ["Outputs: getting the basket returns the saved products (product id and quantity) next to the cart items"]
priority: P1
---

# TC-CART-1-05: GetBasket returns saved products next to the cart items

## Why

- The WebApp reads saved products from this response; if they were missing the section could never render after a reload. Unit layer, mocked repository.

## Preconditions

- Layer: MSTest in `tests/Basket.UnitTests/BasketServiceTests.cs`; `BasketService` built with `Substitute.For<IBasketRepository>()` and `NullLogger<BasketService>.Instance`; `CreateContext("user-1")` gives the authenticated caller `user-1`.
- `GetBasketAsync("user-1")` returns a basket with Items [product 2 x 1] and SavedItems [product 1 x 2].

## Steps

1. Call `service.GetBasket(new GetBasketRequest(), CreateContext("user-1"))`.

## Expected result

- The response `Items` is exactly [product 2 x 1] and `SavedItems` is exactly [product 1 x 2] (product_id and quantity).
