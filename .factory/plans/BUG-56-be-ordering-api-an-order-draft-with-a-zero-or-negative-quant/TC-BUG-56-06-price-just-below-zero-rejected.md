---
id: TC-BUG-56-06
type: sad
sad-path: boundary
layer: functional
covers: ["What should happen: negative price is rejected (boundary just outside: -0.01)"]
priority: P2
---

# TC-BUG-56-06: A draft line with unit price -0.01 is answered with 400 problem details naming the price

## Why

- -0.01 is the smallest negative money amount, just outside the "not negative" limit; it catches a check that truncates or rounds the decimal price (for example comparing `(int)UnitPrice < 0`).

## Preconditions

- Ordering functional host (`tests/Ordering.FunctionalTests`, `OrderingApiFixture`) running; requests are authenticated by `AutoAuthorizeMiddleware` as the test buyer `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`.
- No order data is needed: a draft is computed in memory and never saved.

## Steps

1. Send `POST /api/orders/draft?api-version=1.0` with header `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":-0.01,"oldUnitPrice":-0.01,"quantity":1,"pictureUrl":""}]}`.

## Expected result

- HTTP status is 400 Bad Request (not 500).
- `Content-Type` media type is `application/problem+json`.
- The body is non-empty JSON with `status` = 400 and `detail` = "The unit price of an item cannot be negative.".
- The response has no `orderItems` and no `total` (no draft is returned).
