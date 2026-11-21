---
id: TC-CANC-1-10
type: sad
sad-path: ownership
layer: e2e
covers: ["AC4: a shopper can cancel only their own orders", "Code map AC4: BuyerIdentityGuid cannot be set from the body"]
priority: P2
---

# TC-CANC-1-10: bob cannot cancel alice's order by putting alice's identity in the request body

## Why

- AC4's ownership check compares the order's buyer with an identity carried on the command. If that identity could be supplied in the JSON body, bob could name alice and bypass the rule entirely. This guards the trust boundary separately from TC-CANC-1-09, which sends a plain body. API calls on the test stack (e2e) because the order must be saved.

## Preconditions

- Scenario `canc-1` freshly loaded: alice's order 9108 is Submitted.
- Bearer tokens with the `orders` scope for `bob` and for `alice`.

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` with bob's bearer token, header `x-requestid: <new GUID>`, `Content-Type: application/json`, body `{"orderNumber": 9108, "buyerIdentityGuid": "50ddac7e-9b69-4d68-a91b-25100ef2e403"}`.
2. `GET /api/orders/9108?api-version=1.0` with alice's bearer token.

## Expected result

- Step 1 returns `404`. It does not return `200`.
- Step 2 returns `200` with `status` = `Submitted`.
