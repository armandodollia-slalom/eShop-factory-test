---
id: TC-BUG-57-06
type: sad
sad-path: validation
layer: functional
covers: ["Unknown card type, negative id"]
priority: P2
---

# TC-BUG-57-06: An order with a negative card type (-1) answers 400

## Why

- A negative id can never be a card type; it must also be answered as a bad request instead of failing in the domain or the database. Rejected before saving, so functional.

## Preconditions

- Ordering functional host (`tests/Ordering.FunctionalTests`, `OrderingApiFixture`) running against its Postgres; `OrderingContextSeed` has seeded card types 1 Amex, 2 Visa, 3 MasterCard, and no card type with id -1 exists.
- Requests are authenticated by `AutoAuthorizeMiddleware` as the test buyer `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`.

## Steps

1. Send `POST /api/orders?api-version=1.0` with header `x-requestid: <new GUID>`, `Content-Type: application/json` and body `{"userId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","userName":"TestUser","city":"Redmond","street":"15703 NE 61st Ct","state":"WA","country":"U.S.","zipCode":"98052","cardNumber":"4111111111111111","cardHolderName":"Test User","cardExpiration":"2030-12-31T00:00:00Z","cardSecurityNumber":"123","cardTypeId":-1,"buyer":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":199.99,"oldUnitPrice":199.99,"quantity":1,"pictureUrl":""}]}`.

## Expected result

- HTTP status is 400 Bad Request (not 500).
- `Content-Type` is `application/problem+json` and the body is not empty.
- The body has `status` 400 and an `errors` object whose only key is `CardTypeId`, holding one message that contains `not known`.
