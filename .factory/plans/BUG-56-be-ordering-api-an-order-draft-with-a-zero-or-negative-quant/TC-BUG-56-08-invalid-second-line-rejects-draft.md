---
id: TC-BUG-56-08
type: sad
sad-path: validation
layer: functional
covers: ["What should happen: a draft request whose lines have a quantity below 1 (any line, not only the first)"]
priority: P2
---

# TC-BUG-56-08: A draft whose second line has quantity 0 is rejected with 400 even though its first line is valid

## Why

- The ticket speaks of a request "whose lines" are invalid; real baskets have several lines and a check that only looks at the first line would let the bad one through to the domain and answer 500. Functional, same endpoint.

## Preconditions

- Ordering functional host (`tests/Ordering.FunctionalTests`, `OrderingApiFixture`) running; requests are authenticated by `AutoAuthorizeMiddleware` as the test buyer `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`.
- No order data is needed: a draft is computed in memory and never saved.

## Steps

1. Send `POST /api/orders/draft?api-version=1.0` with header `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":10,"oldUnitPrice":10,"quantity":2,"pictureUrl":""},{"id":"2","productId":1,"productName":"Second draft item","unitPrice":19.5,"oldUnitPrice":19.5,"quantity":0,"pictureUrl":""}]}`.

## Expected result

- HTTP status is 400 Bad Request (not 500).
- `Content-Type` media type is `application/problem+json`.
- The body is non-empty JSON with `status` = 400 and `detail` = "The quantity of each item must be at least 1.".
- The response has no `orderItems` and no `total` (no draft is returned).
