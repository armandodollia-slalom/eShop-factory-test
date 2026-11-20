---
id: TC-ADDED-1-12
type: happy
layer: functional
covers: ["AC4: a basket stored before this change still loads", "AC4: its lines show no date", "Implementation Notes: GetBasket returns none for a line stored without one"]
priority: P1
---

# TC-ADDED-1-12: GetBasket over gRPC loads a basket JSON stored before the change and returns no added_at

## Why

- Old baskets live in Redis as JSON without an `AddedAt` property. The source-generated deserializer and the gRPC mapping must both accept that and return the line with no `added_at`. Only the Basket API host running against a real Redis proves the stored bytes load through the real `GetBasket` call; the unit case TC-ADDED-1-10 mocks the repository.

## Preconditions

- `Basket.FunctionalTests` `RedisFixture` running a real Redis.
- Basket.API hosted in-process (`WebApplicationFactory<Program>`) with its Redis connection pointed at the fixture's Redis and an authentication handler that authenticates every call with claim `sub` = `buyer-<new guid>` (the buyer id below).
- Raw value written directly with `StringSetAsync` at key `/basket/<buyer id>`: the JSON the repository wrote before this change, `{"BuyerId":"<buyer id>","Items":[{"Id":"1","ProductId":99,"ProductName":"Adventurer GPS Watch","UnitPrice":49.99,"OldUnitPrice":0,"Quantity":2,"PictureUrl":""}]}` (no `AddedAt`).

## Steps

1. Through a gRPC `Basket.BasketClient` on the host's HTTP handler, call `GetBasket` with an empty `GetBasketRequest`.

## Expected result

- The call completes with status `OK` (no `RpcException`).
- The response has exactly one item: `product_id` 99, `quantity` 2.
- That item's `added_at` is not set (`AddedAt == null` on the generated message); it is not `1970-01-01T00:00:00Z` and not the current time.
- The raw Redis value at `/basket/<buyer id>` is unchanged after the call (a read does not stamp a date).
