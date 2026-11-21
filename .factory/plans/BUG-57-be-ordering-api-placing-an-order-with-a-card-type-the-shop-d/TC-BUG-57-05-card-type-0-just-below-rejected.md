---
id: TC-BUG-57-05
type: sad
sad-path: boundary
layer: functional
covers: ["Unknown card type, just outside the lower end of the known ids 1..3"]
priority: P1
---

# TC-BUG-57-05: An order with card type 0, just below the lowest known card type, answers 400

## Why

- 0 is the default value of an omitted int and the first id just below the known range; a check that treats 0 as "not set, use a default" would place an order with no card type. Rejected before saving, so functional.

## Preconditions

- Ordering functional host (`tests/Ordering.FunctionalTests`, `OrderingApiFixture`) running against its Postgres; `OrderingContextSeed` has seeded card types 1 Amex, 2 Visa, 3 MasterCard, and no card type with id 0 exists.
- Requests are authenticated by `AutoAuthorizeMiddleware` as the test buyer `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`.

## Steps

1. Send `POST /api/orders?api-version=1.0` with header `x-requestid: <new GUID>`, `Content-Type: application/json` and body `{"userId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","userName":"TestUser","city":"Redmond","street":"15703 NE 61st Ct","state":"WA","country":"U.S.","zipCode":"98052","cardNumber":"4111111111111111","cardHolderName":"Test User","cardExpiration":"2030-12-31T00:00:00Z","cardSecurityNumber":"123","cardTypeId":0,"buyer":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":199.99,"oldUnitPrice":199.99,"quantity":1,"pictureUrl":""}]}`.

## Expected result

- HTTP status is 400 Bad Request (not 500).
- `Content-Type` is `application/problem+json` and the body is not empty.
- The body has `status` 400 and an `errors` object whose only key is `CardTypeId`, holding one message that contains `not known`.
