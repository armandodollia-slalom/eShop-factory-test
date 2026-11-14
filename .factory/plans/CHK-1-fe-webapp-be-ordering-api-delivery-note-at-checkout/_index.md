---
story: CHK-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/68"
story-sha: 522736fd25d0
plan-sha: 6fc3689c8e0d
verified-score: 9
verified-at: "2026-11-14T13:57:03.620Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: 6dda45a97dd7
automation-plan-sha: 6fc3689c8e0d
automation-score: 9
automation-verified-at: "2026-11-14T14:36:05.929Z"
---
# Test plan: CHK-1 [FE - WebApp, BE - Ordering.API] - Delivery note at checkout

Covers the optional delivery note: `deliveryNote` on `POST /api/orders` and `GET /api/orders/{orderId}` (API version 1.0, functional layer, criteria 1-5, 7, 8) and the checkout form field (e2e layer on the test stack, criteria 1, 2, 6). Trimming, the 200-character limit counted after trimming, null for empty or whitespace-only notes, and the 400 validation problem are each one case.

Body B (used by every functional case), `POST /api/orders?api-version=1.0` as alice with header `x-requestid` (fresh GUID):
`{"userId":"50ddac7e-9b69-4d68-a91b-25100ef2e403","userName":"alice","city":"Seattle","street":"1 Main St","state":"WA","country":"USA","zipCode":"98101","cardNumber":"4012888888881881","cardHolderName":"Alice Smith","cardExpiration":"2030-12-01T00:00:00Z","cardSecurityNumber":"123","cardTypeId":1,"buyer":"alice","items":[{"productId":99,"productName":"Adventurer GPS Watch","unitPrice":10.00,"oldUnitPrice":0,"quantity":1,"pictureUrl":""}]}`
plus the `deliveryNote` named in the case. The `<orderId>` is the `ordernumber` of the single entry of `GET /api/orders` as alice.

E2E scenario `chk-1` (new, `extends: default`): alice's basket contains item 99 "Adventurer GPS Watch" with quantity 1; no orders.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-CHK-1-01 | Delivery note is stored and returned by GET /api/orders/{orderId} | happy | functional | AC1 |
| TC-CHK-1-02 | Order placed without deliveryNote has deliveryNote null | happy | functional | AC2 |
| TC-CHK-1-03 | Empty-string deliveryNote is stored as null | happy | functional | AC2 |
| TC-CHK-1-04 | Whitespace-only deliveryNote is stored as null | happy | functional | AC3 |
| TC-CHK-1-05 | Surrounding whitespace is trimmed from the stored note | happy | functional | AC4 |
| TC-CHK-1-06 | A note of exactly 200 characters is accepted | happy | functional | AC5 |
| TC-CHK-1-07 | A 200-character note padded with whitespace is accepted and trimmed | happy | functional | Open Questions answer, AC5 |
| TC-CHK-1-08 | A 201-character note is rejected with 400 and creates no order | sad | functional | AC7 |
| TC-CHK-1-09 | An order stored before the change reads back with deliveryNote null and unchanged fields | happy | functional | AC8 |
| TC-CHK-1-10 | Checkout shows a multi-line field labeled Delivery note (optional) between the address fields and Place order | happy | e2e | Outputs: checkout field |
| TC-CHK-1-11 | Shopper places an order with a delivery note through the UI | happy | e2e | AC1 |
| TC-CHK-1-12 | Shopper places an order with the note left empty through the UI | happy | e2e | AC2 |
| TC-CHK-1-13 | A 201-character note is blocked on the checkout page with the field error | sad | e2e | AC6 |

## Out of scope

- Showing the note anywhere in the WebApp after the order is placed; editing a note after placing the order (Test scope).
- UI cases for criteria 3, 4 and 5 (the Test scope puts them at the API layer only).
- Authentication and ownership of `POST /api/orders` and `GET /api/orders/{orderId}`: unchanged by this story.

## Open questions

- How the e2e spec obtains alice's bearer token to read the order back through `GET /api/orders/{orderId}` is left to the automation (the story does not show the note in the WebApp).
- The story does not state the response body of a successful `POST /api/orders`, so cases take `<orderId>` from `GET /api/orders`.
- Counting of characters that are not single UTF-16 code units (emoji, combining marks) is undefined; no case.
- Concurrency and duplicate `x-requestid` behavior for orders with notes are undefined by the story; no case.
