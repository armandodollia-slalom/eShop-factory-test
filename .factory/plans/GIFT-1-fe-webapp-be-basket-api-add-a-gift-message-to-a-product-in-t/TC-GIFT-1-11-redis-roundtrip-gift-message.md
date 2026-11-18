---
id: TC-GIFT-1-11
type: happy
layer: functional
covers: ["AC4: message persisted with the basket", "Implementation Notes: message lives with the basket on the server"]
priority: P1
---

# TC-GIFT-1-11: Redis keeps a basket item's gift message across save and load

## Why

- AC4 depends on the message being written to and read from Redis with the basket; a missing serializer property (source-generated `BasketSerializationContext`) would drop it silently. Real Redis serialization is only exercised by the functional fixture, so functional rather than unit.

## Preconditions

- `RedisFixture` Redis is running; buyer id `buyer-<new guid>` has no basket.

## Steps

1. With `RedisBasketRepository`, call `UpdateBasketAsync` with a `CustomerBasket` for that buyer holding two items: `{ ProductId: 99, Quantity: 2, GiftMessage: "Happy birthday, Sam!" }` and `{ ProductId: 1, Quantity: 1, GiftMessage: null }`.
2. Call `GetBasketAsync(<buyer id>)`.

## Expected result

- The loaded basket has two items.
- Item with `ProductId` 99 has `Quantity` 2 and `GiftMessage` `"Happy birthday, Sam!"`.
- Item with `ProductId` 1 has `Quantity` 1 and `GiftMessage` null.
