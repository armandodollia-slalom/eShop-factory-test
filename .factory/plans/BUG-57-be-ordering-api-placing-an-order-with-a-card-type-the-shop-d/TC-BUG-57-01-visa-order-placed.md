---
id: TC-BUG-57-01
type: happy
layer: e2e
covers: ["What happens step 3: card type 2 -> 200", "What should happen: orders with a known card type are placed as before"]
priority: P1
---

# TC-BUG-57-01: An order with card type 2 (Visa) is placed with 200 and listed in alice's orders

## Why

- The fix adds a card type check in front of order creation; the ticket requires known card types to be placed as before, and step 3 of the reproduction is exactly this order. A regression would block every checkout. The order must be saved, which the Ordering functional host cannot do, so this runs as API calls on the test stack.

## Preconditions

- Test stack up with scenario `default`: user `alice` (password `Pass123$`); card types 1 Amex, 2 Visa, 3 MasterCard exist.
- An access token for alice with scope `orders` (signed in through Identity); note how many orders `GET /api/orders?api-version=1.0` returns for her before step 1 (N). Other cases on this stack also place orders for alice, so the case does not assume N is 0.
- `GET /api/orders/cardtypes?api-version=1.0` with alice's token returns exactly `[{"id":1,"name":"Amex"},{"id":2,"name":"Visa"},{"id":3,"name":"MasterCard"}]`.

## Steps

1. Send `POST /api/orders?api-version=1.0` with alice's bearer token, header `x-requestid: <new GUID>`, `Content-Type: application/json` and body `{"userId":"<alice's sub claim>","userName":"alice","city":"Redmond","street":"15703 NE 61st Ct","state":"WA","country":"U.S.","zipCode":"98052","cardNumber":"4111111111111111","cardHolderName":"Alice Smith","cardExpiration":"2030-12-31T00:00:00Z","cardSecurityNumber":"123","cardTypeId":2,"buyer":"<alice's sub claim>","items":[{"id":"1","productId":99,"productName":"Adventurer GPS Watch","unitPrice":199.99,"oldUnitPrice":199.99,"quantity":1,"pictureUrl":""}]}`.
2. Poll `GET /api/orders?api-version=1.0` with alice's token until it returns N + 1 orders (at most 30 s).

## Expected result

- Step 1 answers HTTP 200 OK.
- Step 2 returns N + 1 orders for alice; the new order has `total` 199.99.
- No HTTP 500 is returned by either request.
