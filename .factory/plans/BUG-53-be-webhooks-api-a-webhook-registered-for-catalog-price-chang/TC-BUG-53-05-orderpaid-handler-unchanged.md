---
id: TC-BUG-53-05
type: happy
layer: unit
covers: ["Expected: webhooks registered for OrderPaid behave exactly as today"]
priority: P2
---

# TC-BUG-53-05: The OrderPaid handler still sends WebhookData of type OrderPaid to the OrderPaid subscriptions

## Why

- The ticket requires `OrderPaid` webhooks to behave exactly as today, and the fix copied the OrderPaid handler's pattern into a sibling handler. This case pins the OrderPaid handler's routing (subscriptions of type `OrderPaid`, `WebhookData.Type` `OrderPaid`, the event as payload) so a shared refactor cannot change it. A real paid order cannot be produced cheaply on the stack, so the routing is checked in process. It lives in `tests/Application.UnitTests` with NSubstitute substitutes.

## Preconditions

- `IWebhooksRetriever` substitute: `GetSubscriptionsOfType(WebhookType.OrderPaid)` returns one `WebhookSubscription` with `Type = OrderPaid`, `DestUrl = "http://receiver/paid"`, `Token = "paid"`. Any other type returns an empty list.
- `IWebhooksSender` substitute that records its calls.
- An `OrderStatusChangedToPaidIntegrationEventHandler` built with these substitutes and a null logger.
- An `OrderStatusChangedToPaidIntegrationEvent` for order id `7` with an empty `OrderStockItems` list.

## Steps

1. Call `Handle(<the event>)`.

## Expected result

- `GetSubscriptionsOfType` is called exactly once, with `WebhookType.OrderPaid`.
- `SendAll` is called exactly once, with exactly that one subscription.
- The `WebhookData` argument has `Type == "OrderPaid"`.
- Its `Payload`, parsed as JSON, has `OrderId` `7`.
