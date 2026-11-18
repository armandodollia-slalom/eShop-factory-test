---
id: TC-GIFT-1-14
type: happy
layer: unit
covers: ["Implementation Notes: an item sent without a message is accepted"]
priority: P1
---

# TC-GIFT-1-14: UpdateBasket accepts an item sent without gift_message and stores no message

## Why

- The notes require existing Basket API callers (which never set field 7) to keep working; such an item must be stored as "no message", not as an empty string or an error. Request mapping with a mocked repository, so unit.

## Preconditions

- `IBasketRepository` substitute: `UpdateBasketAsync(Arg.Any<CustomerBasket>())` returns the basket it receives.
- Server call context whose user has claim `sub` = `1`.

## Steps

1. Call `BasketService.UpdateBasket` with `UpdateBasketRequest { Items = [ { ProductId = 99, Quantity = 2 } ] }` (`GiftMessage` not set).

## Expected result

- No `RpcException` is thrown.
- `UpdateBasketAsync` was called once with a basket whose `BuyerId` is `1` and whose single item has `ProductId` 99, `Quantity` 2 and `GiftMessage` null.
- The response has one item with `product_id` 99, `quantity` 2 and `gift_message` `""`.
