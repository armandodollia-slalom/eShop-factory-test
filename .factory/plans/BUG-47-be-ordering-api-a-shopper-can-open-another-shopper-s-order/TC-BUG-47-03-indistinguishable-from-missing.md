---
id: TC-BUG-47-03
type: sad
sad-path: ownership
layer: e2e
covers: ["Steps to Reproduce: step 4, second bullet", "Expected: the same answer bob gets in step 4 for an order that does not exist, so he cannot tell that the order exists"]
priority: P1
---

# TC-BUG-47-03: bob's answer for alice's order is identical to his answer for a missing order

## Why

- The story requires more than a refusal: the refusal must not reveal that the order exists (no 403, no different body or headers). A fix that answered 403, or a 404 with a different body, would pass TC-BUG-47-01's status check in spirit but still leak existence; this case compares the two answers directly.

## Preconditions

- Scenario `bug-47` on the test stack; order `A` placed as alice (see `_index.md`); no order `999999`.
- An access token for `bob` with scope `orders` from client `orderingswaggerui`.

## Steps

1. As bob: `GET /api/orders/<A>?api-version=1.0` with `Authorization: Bearer <bob's token>`; record status, `content-type` header and body.
2. As bob: `GET /api/orders/999999?api-version=1.0` with `Authorization: Bearer <bob's token>`; record status, `content-type` header and body.

## Expected result

- Both statuses are `404` (neither is `403`).
- Step 2's body is empty (length 0): the missing-order answer is unchanged by the fix.
- The `content-type` header is the same in both responses (both absent, or both the same value).
- The two bodies are byte-identical.
