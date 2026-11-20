---
id: TC-BUG-53-06
type: happy
layer: unit
covers: ["Expected: webhooks registered for OrderShipped behave exactly as today"]
priority: P2
---

# TC-BUG-53-06: The OrderShipped handler still sends WebhookData of type OrderShipped to the OrderShipped subscriptions

## Why

- The ticket requires `OrderShipped` webhooks to behave exactly as today. Like TC-BUG-53-05, this pins the routing of an untouched sibling handler: subscriptions of type `OrderShipped`, `WebhookData.Type` `OrderShipped`, the event as payload. Shipping an order on the stack needs an admin flow outside this story, so the check runs in process in `tests/Application.UnitTests` with NSubstitute substitutes.

## Preconditions

- `IWebhooksRetriever` substitute: `GetSubscriptionsOfType(WebhookType.OrderShipped)` returns one `WebhookSubscription` with `Type = OrderShipped`, `DestUrl = "http://receiver/shipped"`, `Token = "shipped"`. Any other type returns an empty list.
- `IWebhooksSender` substitute that records its calls.
- An `OrderStatusChangedToShippedIntegrationEventHandler` built with these substitutes and a null logger.
- An `OrderStatusChangedToShippedIntegrationEvent` for order id `8`, `OrderStatus` `"Shipped"` and `BuyerName` `"alice"`.

## Steps

1. Call `Handle(<the event>)`.

## Expected result

- `GetSubscriptionsOfType` is called exactly once, with `WebhookType.OrderShipped`.
- `SendAll` is called exactly once, with exactly that one subscription.
- The `WebhookData` argument has `Type == "OrderShipped"`.
- Its `Payload`, parsed as JSON, has `OrderId` `8`.
