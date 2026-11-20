---
story: BUG-53
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/292"
story-sha: 3331fe075c10
plan-sha: 8abbadf59ccd
verified-score: 9
verified-at: "2026-11-18T16:40:24.283Z"
verified-by: test-planner@6ab9e852/council
automation-sha: de2af53afe58
automation-plan-sha: 8abbadf59ccd
automation-score: 10
automation-verified-at: "2026-11-18T16:58:08.802Z"
---
# Test plan: BUG-53 [BE - Webhooks API] - A webhook registered for catalog price changes is never called when a price changes

A webhook registered on the Webhooks API for `CatalogItemPriceChange` must be called once when a catalog item's price changes through the Catalog API. The call carries the event `CatalogItemPriceChange` and the item's id, new price and old price. A catalog update that keeps the price must call nothing. `OrderPaid` and `OrderShipped` webhooks must keep their current behaviour. The defect sits in the Webhooks API's handler of the Catalog API's `ProductPriceChangedIntegrationEvent`, and the delivery crosses Catalog API → event bus → Webhooks API → webhooks client. So the delivery cases run on the `e2e` layer on the test stack: API calls plus the webhooks client's home page, as the story's Steps to Reproduce do. The event name travels only in the HTTP body (`WebhookData.Type`); the webhooks client stores only `Payload`, `When` and the token, so its page cannot show the name. The event name, and the handlers' type routing, are therefore checked on the `unit` layer (`tests/Application.UnitTests`, which already references `Webhooks.API`), with NSubstitute substitutes for `IWebhooksRetriever` and `IWebhooksSender`.

The e2e cases use a new scenario `bug-53` (`extends: default`). It adds no rows: item 99 "Adventurer GPS Watch" at price `199.99`, users `alice`/`bob` (`Pass123$`) and no webhook subscriptions. The spec reloads it before each case, so item 99's price and the subscription list start fresh. The webhooks client keeps received messages in memory (`HooksRepository`), and a scenario reload may not restart it. Each e2e case therefore uses its own registration tokens and judges only rows that carry them. This relies on the test stack running the webhooks client without a `ValidateToken` setting, so the client accepts any token; the cases state it as a precondition.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-53-01 | Changing item 99's price calls the CatalogItemPriceChange webhook once with the id, new price and old price, and no OrderPaid or OrderShipped webhook | happy | e2e | Steps to Reproduce 1-4; Expected bullet 1 (one call, item id, new price, old price, listed by the webhooks client); Expected bullet 3 (a price change reaches no order webhook); Acceptance Criteria |
| TC-BUG-53-02 | The price-change handler sends WebhookData of type CatalogItemPriceChange carrying ProductId, NewPrice and OldPrice to the CatalogItemPriceChange subscriptions | happy | unit | Expected bullet 1 (event `CatalogItemPriceChange`, payload fields); Code map: handler |
| TC-BUG-53-03 | An update of item 99 that keeps its price calls no webhook | sad | e2e | Expected bullet 2 |
| TC-BUG-53-05 | The OrderPaid handler still sends WebhookData of type OrderPaid to the OrderPaid subscriptions | happy | unit | Expected bullet 3 (OrderPaid unchanged) |
| TC-BUG-53-06 | The OrderShipped handler still sends WebhookData of type OrderShipped to the OrderShipped subscriptions | happy | unit | Expected bullet 3 (OrderShipped unchanged) |

## Out of scope

- Registration itself (`POST /api/webhooks` validation, grant check, listing): the story says it already works; BUG-16 and BUG-52 cover it. Here it is only a precondition (201 and listed).
- Driving a real order to `paid` or `shipped` on the test stack to prove that `OrderPaid`/`OrderShipped` deliveries still happen end to end. Their handlers are untouched. TC-BUG-53-05/06 pin their type routing in process, and TC-BUG-53-01 proves a price change does not reach them.
- The Catalog API's own `PUT /api/catalog/items/{id}` contract (status codes, validation, not-found): unchanged by the story. Its 201 response is only a step precondition here.

## Open questions

- Several subscribers: the story speaks of "the registered destination". Whether every user's `CatalogItemPriceChange` webhook is called (the retriever is not user-scoped), or only the one of the user who registered it, is not stated. No case asserts it.
- Failure of the destination (unreachable URL, non-2xx answer) and retries are not described by the story. No dependency-failure case is written.
- Two quick successive price changes (ordering, one call each) are not described. No concurrency case is written.
- Whether a `PUT` that changes other fields but keeps the price counts as "a price update that does not change the price": TC-BUG-53-03 uses the most literal reading, the item exactly as returned by `GET` with the same price.
