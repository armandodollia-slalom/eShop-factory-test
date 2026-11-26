---
id: TC-CART-1-01
type: happy
layer: unit
covers: ["AC1", "Save for later button: moves the whole line, with its quantity"]
priority: P1
---

# TC-CART-1-01: SaveForLater moves the whole cart line, with its quantity, to saved items

## Why

- AC1 core API behavior: the line must leave the cart and arrive in saved with the same quantity, and the other line must stay. A unit test with a mocked repository checks this cheaply; the UI view of it is TC-CART-1-16.

## Preconditions

- Layer: MSTest in `tests/Basket.UnitTests/BasketServiceTests.cs`; `BasketService` built with `Substitute.For<IBasketRepository>()` and `NullLogger<BasketService>.Instance`; `CreateContext("user-1")` gives the authenticated caller `user-1`.
- Repository `GetBasketAsync("user-1")` returns a basket with Items [product 1 x 2, product 2 x 1] and SavedItems [].
- Repository `UpdateBasketAsync` echoes the basket it receives.

## Steps

1. Call `service.SaveForLater(new SaveForLaterRequest { ProductId = 1 }, CreateContext("user-1"))`.

## Expected result

- The call returns a response whose `Items` is exactly [product 2 x 1] and whose `SavedItems` is exactly [product 1 x 2].
- `UpdateBasketAsync` was called once with a basket whose Items are [product 2 x 1] and SavedItems are [product 1 x 2].
