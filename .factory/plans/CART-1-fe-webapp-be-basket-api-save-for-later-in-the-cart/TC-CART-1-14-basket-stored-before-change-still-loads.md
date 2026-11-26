---
id: TC-CART-1-14
type: sad
sad-path: validation
layer: functional
covers: ["Technical Notes: a basket stored before this change has no saved products and must still load"]
priority: P1
---

# TC-CART-1-14: A basket stored without a SavedItems property loads with an empty saved list

## Why

- Existing customers' baskets in Redis predate this change; a null or failed deserialization would break their cart page after deploy.

## Preconditions

- `RedisFixture`; buyer id `buyer-<guid>`.
- Raw string value written with `StringSetAsync` at Redis key `/basket/<buyerId>`: `{"BuyerId":"<buyerId>","Items":[{"Id":"a1","ProductId":2,"ProductName":"Basecamp Mug","UnitPrice":10.0,"OldUnitPrice":0,"Quantity":1,"PictureUrl":""}]}` (no `SavedItems` property).

## Steps

1. Call `repository.GetBasketAsync(buyerId)`.

## Expected result

- A non-null basket is returned with Items exactly [product 2 x 1] and SavedItems an empty list (not null); no exception.
