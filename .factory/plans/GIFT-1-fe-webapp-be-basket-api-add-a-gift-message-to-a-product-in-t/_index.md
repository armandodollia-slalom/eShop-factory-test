---
story: GIFT-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/267"
story-sha: 2f10ada8e4ba
plan-sha: 599ff29a1ffd
verified-score: 10
verified-at: "2026-11-18T08:04:07.683Z"
verified-by: test-planner@6ab9e852/council
automation-sha: 1bfe984f4392
automation-plan-sha: 599ff29a1ffd
automation-score: 10
automation-verified-at: "2026-11-18T09:56:15.934Z"
---
# Test plan: GIFT-1 Add a gift message to a product in the shopping bag

Scope: the per-line gift message on the shopping bag page (`/cart`) of the WebApp (add, show, edit, clear, the 60-character input limit), its persistence with the basket in the Basket API (Redis) through reloads, sign-out/sign-in and quantity changes, its removal when the product leaves the bag, compatibility with Basket API callers and stored baskets that carry no message (AC7), that placing an order still works with a messaged line and does not send the message to Ordering, and regression cases for the upheld findings SOL-1 (a refused save keeps the stored message) and SOL-2 (a gift-message post without a product id). UI behaviour is planned on the `e2e` layer as `alice` on scenario `default`; the Basket API's message mapping is planned on `unit` (`tests/Basket.UnitTests`, `BasketService` with a mocked `IBasketRepository`) and its storage on `functional` (`tests/Basket.FunctionalTests`, `RedisBasketRepository` against the fixture's real Redis), because the Basket functional project has no gRPC host; the order request's JSON is planned on `unit` through `OrderingService` with a capturing HTTP handler.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-GIFT-1-01 | A bag line without a message offers "Add a gift message" and shows no message | happy | e2e | AC1 |
| TC-GIFT-1-02 | Saving a gift message shows it in quotes under the product name with an "Edit" action | happy | e2e | AC2 |
| TC-GIFT-1-03 | The message box stops at 60 characters and a 60-character message is saved whole | sad (boundary) | e2e | AC6, AC2 |
| TC-GIFT-1-04 | Editing a gift message replaces the shown message | happy | e2e | AC3 (edit) |
| TC-GIFT-1-05 | Clearing the text and saving removes the message and brings back "Add a gift message" | happy | e2e | AC3 (clear) |
| TC-GIFT-1-06 | The gift message survives a page reload | happy | e2e | AC4 (reload) |
| TC-GIFT-1-07 | The gift message survives signing out and signing in again | happy | e2e | AC4 (sign out/in), Implementation Notes: stored on the server |
| TC-GIFT-1-08 | The gift message survives a change of the line's quantity | happy | e2e | AC4 (quantity) |
| TC-GIFT-1-09 | Removing the product and adding it again from its product page gives a line with no message | happy | e2e | AC5 |
| TC-GIFT-1-10 | Placing an order from a bag with a gift message still creates the order | happy | e2e | Implementation Notes: placing an order is unchanged |
| TC-GIFT-1-11 | Redis keeps a basket item's gift message across save and load | happy | functional | AC4, Implementation Notes: message lives with the basket on the server |
| TC-GIFT-1-12 | A basket stored without any gift message field still loads from Redis | happy | functional | AC7 |
| TC-GIFT-1-13 | GetBasket returns an empty gift_message for a stored item without a message | happy | unit | AC7 |
| TC-GIFT-1-14 | UpdateBasket accepts an item sent without gift_message and stores no message | happy | unit | Implementation Notes: existing callers keep working |
| TC-GIFT-1-17 | A rejected save keeps the stored message under the product name and shows an inline error | sad (validation) | e2e | kept-for SOL-1, AC3 |
| TC-GIFT-1-18 | A gift message post without a product id shows a notice above the bag and changes nothing | sad (validation) | e2e | kept-for SOL-2 |
| TC-GIFT-1-19 | A gift message post without a product id on an empty bag shows the notice and the bag stays empty | sad (validation) | e2e | kept-for SOL-2 |
| TC-GIFT-1-20 | The order request sent to Ordering carries no gift message | happy | unit | Implementation Notes: message not sent to ordering |

## Out of scope

- Sending the gift message to Ordering, showing it on orders or order emails: the story says placing an order is unchanged and the message is not sent to ordering.
- Ownership of baskets (one shopper reading another's bag): unchanged existing Basket API behaviour keyed by the caller's identity; the story adds nothing to it.
- Unauthenticated calls to the Basket API (`Unauthenticated`): unchanged existing behaviour.

## Open questions

- Messages longer than 60 characters sent directly to the Basket API over gRPC: the acceptance criteria only limit the box (AC6). The implementation notes say the API answers `InvalidArgument` and stores nothing; no case asserts the gRPC status itself. The shopper-visible result of that refusal is covered by the SOL-1 regression case TC-GIFT-1-17.
- Whitespace-only text: AC3 only defines clearing the text. Whether "   " clears the message or is kept is the implementer's decision (clears), not a stated requirement.
- Leading or trailing spaces around a message (trimmed or kept) are not defined by the story.
- A save failing because the Basket API is unavailable (rather than refusing the message): the story names no outcome; TC-GIFT-1-17 covers the same inline error through a refused save, which is reachable on the test stack.
- AC7 through the browser would need a basket written to Redis in the pre-change JSON shape; test stack scenarios seed Postgres only, so AC7 is planned at the storage (TC-GIFT-1-12) and mapping (TC-GIFT-1-13) level, and a line without a stored message is shown as "Add a gift message" by TC-GIFT-1-01.
- Two lines for the same product (whether a message belongs to the product or to a line) cannot happen today since adding the same product raises the quantity; not planned.
