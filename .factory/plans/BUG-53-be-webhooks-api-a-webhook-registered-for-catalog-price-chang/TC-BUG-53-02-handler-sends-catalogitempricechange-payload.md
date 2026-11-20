---
id: TC-BUG-53-02
type: happy
layer: unit
covers: ["Expected: webhook call with the event CatalogItemPriceChange", "Expected: the item's id, its new price and its old price", "Code map: ProductPriceChangedIntegrationEventHandler"]
priority: P1
---

# TC-BUG-53-02: The price-change handler sends WebhookData of type CatalogItemPriceChange carrying ProductId, NewPrice and OldPrice to the CatalogItemPriceChange subscriptions

## Why

- The ticket requires the call to carry the event `CatalogItemPriceChange`. The webhooks client drops `Type` when it stores a message, so the e2e case cannot observe the event name. This unit case pins it, and also pins that the handler sends to the price-change subscriptions and not to another type's. It lives in `tests/Application.UnitTests`, which already references `Webhooks.API`, with NSubstitute substitutes and no running services.

## Preconditions

- `IWebhooksRetriever` substitute: `GetSubscriptionsOfType(WebhookType.CatalogItemPriceChange)` returns one `WebhookSubscription` with `Type = CatalogItemPriceChange`, `DestUrl = "http://receiver/hook"`, `Token = "t1"`. Any other type returns an empty list.
- `IWebhooksSender` substitute that records its calls.
- A `ProductPriceChangedIntegrationEventHandler` built with these substitutes and a null logger.

## Steps

1. Call `Handle(new ProductPriceChangedIntegrationEvent(99, 149.99m, 199.99m))`.

## Expected result

- `GetSubscriptionsOfType` is called exactly once, with `WebhookType.CatalogItemPriceChange`.
- `SendAll` is called exactly once.
- Its subscriptions argument holds exactly the one subscription returned above.
- The `WebhookData` argument has `Type == "CatalogItemPriceChange"`.
- Its `Payload`, parsed as JSON, has `ProductId` `99`, `NewPrice` `149.99` and `OldPrice` `199.99`.
