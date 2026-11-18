---
id: TC-GIFT-1-20
type: happy
layer: unit
covers: ["Implementation Notes: placing an order is unchanged, the message is not sent to ordering"]
priority: P1
---

# TC-GIFT-1-20: The order request sent to Ordering carries no gift message

## Why

- The notes say the message is not sent to ordering. TC-GIFT-1-10 only proves checkout still succeeds, which Ordering would also do if it silently ignored a forwarded field. This case checks the actual outgoing JSON built by the production serialization (`OrderingService.CreateOrder` with `JsonContent.Create`), which needs no running service, so unit.

## Preconditions

- `eShop.WebApp.Services.OrderingService` built over an `HttpClient` (base address `http://ordering/`) whose `HttpMessageHandler` captures the request and answers `200 OK`. The unit test project must reference `src/WebApp` (no existing unit test project does).
- A `CreateOrderRequest` with `UserId` `alice-id`, `UserName` `alice`, valid address strings, `CardTypeId` 1, `Buyer` `alice-id`, and `Items` holding one `BasketItem { Id = "1", ProductId = 99, ProductName = "Adventurer GPS Watch", UnitPrice = 10.0, Quantity = 2, GiftMessage = "Happy birthday, Sam!" }`.

## Steps

1. Call `OrderingService.CreateOrder(request, Guid.NewGuid())` and read the captured request body as a string.

## Expected result

- The request is `POST /api/Orders/`.
- The body parses as JSON; `items` has one element with `productId` 99 and `quantity` 2.
- That element has no property named `giftMessage` (compared case-insensitively), and the string `Happy birthday, Sam!` does not occur anywhere in the body.
