---
id: TC-GIFT-1-13
type: happy
layer: unit
covers: ["AC7: lines of an old bag show \"Add a gift message\"", "Outputs: BasketItem.gift_message (proto field 7)"]
priority: P1
---

# TC-GIFT-1-13: GetBasket returns an empty gift_message for a stored item without a message

## Why

- AC7's display depends on the API turning a null stored message into the proto default (`""`), which the WebApp reads as "no message"; assigning null to a protobuf string field throws, which would break every old bag. Pure mapping with a mocked repository, so unit.

## Preconditions

- `IBasketRepository` substitute: `GetBasketAsync("1")` returns `CustomerBasket { BuyerId = "1", Items = [ { ProductId = 99, Quantity = 2, GiftMessage = null }, { ProductId = 1, Quantity = 1, GiftMessage = "Happy birthday, Sam!" } ] }`.
- Server call context whose user has claim `sub` = `1`.

## Steps

1. Call `BasketService.GetBasket(new GetBasketRequest(), context)`.

## Expected result

- No exception; the response has two items.
- Item `product_id` 99: `quantity` 2, `gift_message` `""`.
- Item `product_id` 1: `quantity` 1, `gift_message` `"Happy birthday, Sam!"`.
