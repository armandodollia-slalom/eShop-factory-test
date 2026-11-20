---
id: TC-BUG-56-05
type: sad
sad-path: validation
layer: functional
covers: ["What happens: unit price -5 with quantity 1 -> 500", "What should happen: negative price is a 4xx that says what is wrong"]
priority: P1
---

# TC-BUG-56-05: A draft line with unit price -5 and quantity 1 is answered with 400 problem details naming the price

## Why

- The ticket's third reproduction: a negative price with a valid quantity, so only the price rule can reject it. Without it, `OrderItem` throws `OrderingDomainException` and the caller sees an empty 500.

## Preconditions

- Ordering functional host (`tests/Ordering.FunctionalTests`, `OrderingApiFixture`) running; requests are authenticated by `AutoAuthorizeMiddleware` as the test buyer `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`.
- No order data is needed: a draft is computed in memory and never saved.

## Steps

1. Send `POST /api/orders/draft?api-version=1.0` with header `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":-5,"oldUnitPrice":-5,"quantity":1,"pictureUrl":""}]}`.

## Expected result

- HTTP status is 400 Bad Request (not 500).
- `Content-Type` media type is `application/problem+json`.
- The body is non-empty JSON with `status` = 400 and `detail` = "The unit price of an item cannot be negative.".
- The response has no `orderItems` and no `total` (no draft is returned).
