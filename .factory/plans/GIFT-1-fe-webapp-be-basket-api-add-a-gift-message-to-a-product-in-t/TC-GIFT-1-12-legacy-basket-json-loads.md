---
id: TC-GIFT-1-12
type: happy
layer: functional
covers: ["AC7: a bag saved before this change still opens", "Implementation Notes: a stored basket without messages still loads"]
priority: P1
---

# TC-GIFT-1-12: A basket stored without any gift message field still loads from Redis

## Why

- AC7 protects every shopper's existing bag: baskets in Redis were serialized before `GiftMessage` existed. A deserialization failure would make the bag unopenable. The stored shape can only be written directly to Redis, which the functional fixture allows and the test stack scenarios do not.

## Preconditions

- `RedisFixture` Redis is running; buyer id `legacy-<new guid>`.
- Redis key `/basket/legacy-<guid>` is set directly (not through the repository) to the pre-change JSON:
  `{"BuyerId":"legacy-<guid>","Items":[{"Id":"1","ProductId":99,"ProductName":"Adventurer GPS Watch","UnitPrice":10.0,"OldUnitPrice":0,"Quantity":2,"PictureUrl":null}]}` (no `GiftMessage` property).

## Steps

1. With `RedisBasketRepository`, call `GetBasketAsync("legacy-<guid>")`.

## Expected result

- No exception is thrown and the result is not null.
- `BuyerId` is `legacy-<guid>`; the basket has one item with `ProductId` 99, `Quantity` 2 and `GiftMessage` null.
