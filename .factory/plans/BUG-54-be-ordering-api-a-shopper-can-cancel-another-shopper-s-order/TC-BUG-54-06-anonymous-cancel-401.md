---
id: TC-BUG-54-06
type: sad
sad-path: auth
layer: e2e
covers: ["Expected: a request without a token is still refused with 401"]
priority: P2
---

# TC-BUG-54-06: A cancel request without a token is refused with 401 and alice's order stays Submitted

## Why

- The ticket keeps the anonymous 401 unchanged; the fix moves identity resolution into the handler, so a regression could let an anonymous request reach it. The functional host signs every request in automatically, so a real unauthenticated request is only possible on the test stack.

## Preconditions

- Test stack running with scenario `default`; an Ordering API token for `alice`.
- alice has one `Submitted` order created with `POST /api/orders?api-version=1.0`; its number is `A`.

## Steps

1. With no `Authorization` header: `PUT /api/orders/cancel?api-version=1.0` with a new `x-requestid`, body `{ "orderNumber": A }`.
2. As alice: `GET /api/orders/A?api-version=1.0`.

## Expected result

- Step 1 answers `401 Unauthorized`.
- Step 2 answers `200 OK` with `status` = `Submitted`.
