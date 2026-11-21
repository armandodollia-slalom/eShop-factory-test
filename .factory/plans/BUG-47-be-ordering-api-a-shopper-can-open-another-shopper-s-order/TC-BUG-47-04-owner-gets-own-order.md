---
id: TC-BUG-47-04
type: happy
layer: e2e
covers: ["Steps to Reproduce: step 4, first bullet", "Expected: alice still gets her own order (200), as today"]
priority: P1
---

# TC-BUG-47-04: alice requesting her own order still gets 200 with the order

## Why

- The fix filters orders by owner; a wrong filter (for example comparing against the wrong claim) would hide every order from its owner too. This case proves the owner still gets the full order, on the test stack where the order really exists.

## Preconditions

- Scenario `bug-47` on the test stack; order `A` placed as alice (see `_index.md`).
- An access token for `alice` with scope `orders` from client `orderingswaggerui`.

## Steps

1. As alice: `GET /api/orders/<A>?api-version=1.0` with header `Authorization: Bearer <alice's token>`.

## Expected result

- Status is `200`, `content-type` contains `application/json`.
- Body `orderNumber` = `<A>`.
- Body `street` = `15703 NE 61st Ct`, `city` = `Redmond`, `state` = `WA`, `country` = `U.S.`, `zipcode` = `98052`.
- Body `orderItems` has exactly one item with `productName` = `Adventurer GPS Watch`, `units` = 1, `unitPrice` = 10.
- Body `total` = 10.
