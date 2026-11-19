---
id: TC-BUG-56-02
type: sad
sad-path: boundary
layer: functional
covers: ["What happens step 3: quantity 0 -> 500 with empty body", "What should happen: quantity below 1 is a 4xx that says what is wrong"]
priority: P1
---

# TC-BUG-56-02: A draft line with quantity 0 is answered with 400 problem details naming the quantity

## Why

- This is the exact reproduction in the ticket (quantity 0 gave an empty 500) and 0 is the value just outside the lower limit of 1. Functional exercises the real endpoint pipeline and proves the domain exception no longer escapes as a server error.

## Preconditions

- Ordering functional host (`tests/Ordering.FunctionalTests`, `OrderingApiFixture`) running; requests are authenticated by `AutoAuthorizeMiddleware` as the test buyer `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`.
- No order data is needed: a draft is computed in memory and never saved.

## Steps

1. Send `POST /api/orders/draft?api-version=1.0` with header `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":10,"oldUnitPrice":10,"quantity":0,"pictureUrl":""}]}`.

## Expected result

- HTTP status is 400 Bad Request (not 500).
- `Content-Type` media type is `application/problem+json`.
- The body is non-empty JSON with `status` = 400 and `detail` = "The quantity of each item must be at least 1.".
- The response has no `orderItems` and no `total` (no draft is returned).
