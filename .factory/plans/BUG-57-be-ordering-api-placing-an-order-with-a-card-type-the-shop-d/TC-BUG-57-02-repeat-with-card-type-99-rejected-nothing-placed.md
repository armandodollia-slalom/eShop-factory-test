---
id: TC-BUG-57-02
type: sad
sad-path: validation
layer: e2e
covers: ["What happens step 4: card type 99", "What should happen: 4xx that says the card type is not known, no server error", "What should happen: the order with an unknown card type is not placed"]
priority: P1
---

# TC-BUG-57-02: Repeating alice's order with card type 99 answers 400 with an error under CardTypeId and places no order

## Why

- This is the ticket's reproduction on the real stack: after a successful card type 2 order, the same order with card type 99 used to answer 500 with an empty body. A bad request must not create an order, so the case also checks alice's order list on the deployed services (Ordering API, database and event flow), which only the test stack can show.

## Preconditions

- TC-BUG-57-01's preconditions, and alice has just placed the card type 2 order of TC-BUG-57-01 in the same test; her order count after that order is M (N + 1 in TC-BUG-57-01's terms).

## Steps

1. Send `POST /api/orders?api-version=1.0` with alice's bearer token, header `x-requestid: <new GUID, different from TC-BUG-57-01's>`, `Content-Type: application/json` and the same body as TC-BUG-57-01 step 1 except `"cardTypeId":99`.
2. Wait 5 s, then send `GET /api/orders?api-version=1.0` with alice's token.

## Expected result

- Step 1 answers HTTP 400 Bad Request, not 500.
- Step 1's `Content-Type` is `application/problem+json`, and its body is not empty.
- The body has `status` 400 and an `errors` object whose only key is `CardTypeId`; its message contains `not known`.
- Step 2 still returns M orders for alice (no new order beyond the card type 2 one); no order with card type 99 was created.
