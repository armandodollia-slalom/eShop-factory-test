---
id: TC-CANC-1-09
type: sad
sad-path: ownership
layer: e2e
covers: ["AC4: bob's request to cancel alice's order is refused (403 or 404) and her order keeps its status", "Decision: someone else's order answers 404"]
priority: P1
---

# TC-CANC-1-09: bob's cancel request for alice's order is refused and the order stays Submitted

## Why

- AC4 limits cancelling to the order's owner. Before this story `PUT /api/orders/cancel` cancelled any order number, so any signed-in user could cancel another shopper's order. The case needs a saved order, which the Ordering functional host cannot hold, so it runs as API calls on the test stack (e2e layer), as the project context prescribes.

## Preconditions

- Scenario `canc-1` freshly loaded: alice's order 9108 is Submitted; bob has no orders.
- Bearer tokens with the `orders` scope for `bob` and for `alice` from Identity (as in `e2e/teststack/bug-30.spec.ts`).

## Steps

1. `PUT /api/orders/cancel?api-version=1.0` on the Ordering API with bob's bearer token, header `x-requestid: <new GUID>`, `Content-Type: application/json`, body `{"orderNumber": 9108}`.
2. `GET /api/orders/9108?api-version=1.0` with alice's bearer token.

## Expected result

- Step 1 returns `404` (AC4 accepts 403 or 404; the implementation decision is 404). It does not return `200`.
- Step 2 returns `200` with `status` = `Submitted`.
