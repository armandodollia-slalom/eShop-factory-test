---
id: TC-BUG-54-05
type: sad
sad-path: not-found
layer: e2e
covers: ["Steps to Reproduce 2-3", "Expected: step 3 is refused", "Expected: the answer does not reveal whether that order exists"]
priority: P1
---

# TC-BUG-54-05: bob's refusal for alice's order matches his answer for a missing order, before and after bob has an order of his own

## Why

- This is the reported defect (bob's cancel of alice's order answered 200) plus the ticket's rule that the refusal must not reveal whether the order exists; before the fix a missing order answered 500, which lets a caller enumerate order numbers. The comparison is made twice: first as bob with no buyer record (story step 2), where a refusal could fire before the order lookup matters, then after bob has placed an order, so a handler that refuses buyer-less callers early but answers differently for a missing order once the caller has a buyer record is caught. It needs alice's and bob's saved orders and real tokens, so it runs on the test stack.

## Preconditions

- Test stack running with scenario `default`; Ordering API tokens for `alice` and `bob`.
- bob has no orders (`GET /api/orders?api-version=1.0` as bob returns `[]`) before step 1.
- alice has one `Submitted` order created with `POST /api/orders?api-version=1.0`; its number is `A`.
- `N` = 999999, an order number no order has (alice's `GET /api/orders/999999?api-version=1.0` answers 404).

## Steps

1. As bob: `PUT /api/orders/cancel?api-version=1.0` with header `x-requestid: <new GUID>`, `Authorization: Bearer <bob token>`, body `{ "orderNumber": A }`.
2. As bob: `PUT /api/orders/cancel?api-version=1.0` with a different new `x-requestid`, `Authorization: Bearer <bob token>`, body `{ "orderNumber": 999999 }`.
3. As bob: `POST /api/orders?api-version=1.0` with a new `x-requestid` (one item of catalog item 99 "Adventurer GPS Watch", a valid card), so bob has a buyer record; then `GET /api/orders?api-version=1.0` as bob lists one order.
4. As bob: `PUT /api/orders/cancel?api-version=1.0` with a new `x-requestid`, `Authorization: Bearer <bob token>`, body `{ "orderNumber": A }`.
5. As bob: `PUT /api/orders/cancel?api-version=1.0` with a new `x-requestid`, `Authorization: Bearer <bob token>`, body `{ "orderNumber": 999999 }`.

## Expected result

- Steps 1 and 2 both answer `404 Not Found` with an empty body (content length 0); neither is `200 OK` or `500 Internal Server Error`.
- Steps 4 and 5 both answer `404 Not Found` with an empty body (content length 0); neither is `200 OK` or `500 Internal Server Error`.
- No response in steps 1, 2, 4 or 5 carries a ProblemDetails body or the text "Cancel order failed to process.".
