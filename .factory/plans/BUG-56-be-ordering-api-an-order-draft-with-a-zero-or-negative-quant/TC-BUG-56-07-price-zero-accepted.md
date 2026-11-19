---
id: TC-BUG-56-07
type: happy
layer: functional
covers: ["What should happen: only a negative price is rejected (boundary just inside: 0 is accepted)", "Valid drafts are answered as before"]
priority: P2
---

# TC-BUG-56-07: A draft line with unit price 0 is accepted with 200 and total 0

## Why

- The rule forbids negative prices only, so 0 (a free item) is valid; a check written as `<= 0` would wrongly reject it. This is the just-inside boundary paired with TC-BUG-56-06.

## Preconditions

- Ordering functional host (`tests/Ordering.FunctionalTests`, `OrderingApiFixture`) running; requests are authenticated by `AutoAuthorizeMiddleware` as the test buyer `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`.
- No order data is needed: a draft is computed in memory and never saved.

## Steps

1. Send `POST /api/orders/draft?api-version=1.0` with header `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":0,"oldUnitPrice":0,"quantity":3,"pictureUrl":""}]}`.

## Expected result

- HTTP status is 200 OK.
- `orderItems` has exactly 1 entry with `productId` 99, `units` 3, `unitPrice` 0.
- `total` is 0.
