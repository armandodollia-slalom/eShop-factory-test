---
id: TC-BUG-56-04
type: happy
layer: functional
covers: ["What should happen: quantity below 1 is rejected (boundary just inside: 1 is accepted)", "Valid drafts are answered as before"]
priority: P1
---

# TC-BUG-56-04: A draft line with quantity 1 is accepted with 200

## Why

- The limit is "below 1", so 1 is the value just inside it; an off-by-one check (`<= 1`) would wrongly reject single-unit drafts, the most common basket line. Functional, same endpoint as the rejection cases.

## Preconditions

- Ordering functional host (`tests/Ordering.FunctionalTests`, `OrderingApiFixture`) running; requests are authenticated by `AutoAuthorizeMiddleware` as the test buyer `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`.
- No order data is needed: a draft is computed in memory and never saved.

## Steps

1. Send `POST /api/orders/draft?api-version=1.0` with header `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":10,"oldUnitPrice":10,"quantity":1,"pictureUrl":""}]}`.

## Expected result

- HTTP status is 200 OK.
- `orderItems` has exactly 1 entry with `productId` 99 and `units` 1.
- `total` is 10.
