---
story: BUG-47
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/240"
story-sha: 86c99e48ef5f
plan-sha: ceb58dbf6250
verified-score: 10
verified-at: "2026-11-17T19:02:17.100Z"
verified-by: as-is/council
automation-sha: 8aec4d40e963
automation-plan-sha: ceb58dbf6250
automation-score: 10
automation-verified-at: "2026-11-17T19:09:58.527Z"
---
# Test plan: BUG-47 [BE - Ordering API] - A shopper can open another shopper's order

Security bug fix in the Ordering API: `GET /api/orders/{orderId}?api-version=1.0` must return an order only to the shopper who owns it. When another signed-in shopper asks for it, the API must answer 404 with no order data, exactly as it answers for an order number that does not exist, so the caller cannot tell the order exists. The owner still gets 200 with the order, and `GET /api/orders` (the caller's own list) is unchanged. Every case runs on the `e2e` layer as Playwright API calls on the test stack, because the story's acceptance criterion is "Given the test stack is running" and because the Ordering functional host cannot save an order (see Project context). The cases use the seeded users `alice` and `bob` (`Pass123$`) from scenario `default`, with access tokens with the `orders` scope from the `orderingswaggerui` client (implicit flow, as in `e2e/teststack/bug-15.spec.ts` and `bug-30.spec.ts`).

Shared test data: scenario `bug-47` (`extends: default`) adds no rows. Before the cases run, the spec places one order as alice and one as bob with `POST /api/orders?api-version=1.0`, each with its own token and a fresh `x-requestid` header, and the full body that `order()` builds in `e2e/teststack/bug-30.spec.ts:49-63` (the validator rejects a body without the card holder, expiry and security code):

```json
{
  "userId": "<sub claim of that user's token>",
  "userName": "<alice | bob>",
  "buyer": "<alice | bob>",
  "city": "Redmond", "street": "15703 NE 61st Ct", "state": "WA", "country": "U.S.", "zipCode": "98052",
  "cardNumber": "4012888888881881",
  "cardHolderName": "<Alice Smith | Bob Smith>",
  "cardExpiration": "2030-12-31T00:00:00Z",
  "cardSecurityNumber": "123",
  "cardTypeId": 2,
  "items": [{ "id": "1", "productId": 99, "productName": "Adventurer GPS Watch", "unitPrice": 10.0, "oldUnitPrice": 10.0, "quantity": 1, "pictureUrl": null }]
}
```

Each call must answer 200. Each order's number is read from its owner's `GET /api/orders` list. They are called `A` (alice's order) and `B` (bob's order) below. Order number `999999` exists for no one.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-47-03 | bob's answer for alice's order is identical to his answer for a missing order | sad | e2e | Steps 3, 4 (second bullet); Expected: step 3 answers 404 with no order data, the same answer as step 4 "so he cannot tell that the order exists" |
| TC-BUG-47-04 | alice requesting her own order still gets 200 with the order | happy | e2e | Steps 4 (first bullet); Expected: alice still gets her own order (200), as today |
| TC-BUG-47-07 | alice's order list still lists only her orders, including A | happy | e2e | Expected: `GET /api/orders` works exactly as today |

## Out of scope

- WebApp UI (My orders page, order detail page): the story is a back-end API bug; the WebApp's order detail only requests the signed-in user's own orders and is not named in Expected. No feature video beyond the API spec's recording is needed.
- Unit and functional layers: the behaviour needs saved orders owned by two different users; the Ordering functional host cannot save an order, and the story's acceptance criterion names the test stack.
- Mirrored cases with the roles swapped (alice reading bob's order, bob reading his own order, bob's list): alice and bob have the same role and permissions, so swapping them exercises no other branch. Order `B` exists only so TC-BUG-47-07 can show the list excludes another shopper's order.
- `PUT /api/orders/cancel`, `PUT /api/orders/ship`, `POST /api/orders/draft`, `GET /api/orders/cardtypes`: not mentioned by the story.

## Open questions

- Requests without a token or with a token lacking the `orders` scope: the story does not mention them, so no case asserts their outcome (today they answer 401; this fix should not change that).
- Whether cancelling or shipping another shopper's order is also allowed today is not part of this bug; a separate ticket would be needed.
- "No order data" is read as: the 404 response body is empty (`TypedResults.NotFound()` writes no body). If the API instead returned a problem-details body, TC-BUG-47-03 would require that it is byte-identical for both requests.
