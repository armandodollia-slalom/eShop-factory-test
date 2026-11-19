---
id: TC-BUG-56-01
type: happy
layer: functional
covers: ["What should happen: valid drafts are answered as before", "What happens step 2: quantity 2, unit price 10 -> 200, 2 units, total 20"]
priority: P1
---

# TC-BUG-56-01: A valid draft is answered with 200 and the computed draft

## Why

- The fix adds validation in front of `Mediator.Send`; the ticket requires valid drafts to be answered as before (step 2: 2 units at 10 -> total 20). A regression here would break checkout for every buyer. Functional is the cheapest layer that runs the real endpoint and handler; no order is saved, so the Ordering functional host limitation does not apply.

## Preconditions

- Ordering functional host (`tests/Ordering.FunctionalTests`, `OrderingApiFixture`) running; requests are authenticated by `AutoAuthorizeMiddleware` as the test buyer `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`.
- No order data is needed: a draft is computed in memory and never saved.

## Steps

1. Send `POST /api/orders/draft?api-version=1.0` with header `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":10,"oldUnitPrice":10,"quantity":2,"pictureUrl":""}]}`.

## Expected result

- HTTP status is 200 OK.
- `orderItems` has exactly 1 entry with `productId` 99, `productName` "Adventurer GPS Watch", `units` 2, `unitPrice` 10.
- `total` is 20.
