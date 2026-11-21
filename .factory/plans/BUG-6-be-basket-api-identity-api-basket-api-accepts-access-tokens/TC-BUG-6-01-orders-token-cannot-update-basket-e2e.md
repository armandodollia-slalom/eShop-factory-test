---
id: TC-BUG-6-01
type: sad
sad-path: auth
layer: e2e
covers: ["Steps to Reproduce 1-2", "Expected: rejected, nothing written to Redis", "Acceptance Criteria: steps repeated, result matches Expected"]
priority: P0
---

# TC-BUG-6-01: Real Identity token with only the orders scope cannot update alice's basket

## Why

- This is the story's literal reproduction: a genuine access token from Identity.API for alice that lacks the `basket` scope was accepted by `UpdateBasket` and written to Redis. Only the test stack proves that a real Identity-issued token (real signature, audience and scope claim shape) is now rejected; the functional cases use a synthetic principal. One e2e case is enough for the repro; the claim-shape variants live at the functional layer.

## Preconditions

- Test stack up (`factory teststack up`) with scenario `bug-6` (new; `extends: default`, adds no rows): alice (`Pass123$`) has an empty basket.
- Token A (no basket scope): implicit-flow sign-in as alice on Identity.API `GET /connect/authorize?client_id=orderingswaggerui&response_type=token&scope=orders&redirect_uri=<OrderingApiClient>/swagger/oauth2-redirect.html&state=bug6`; `access_token` read from the fragment of the 302 `Location` returned by `/connect/authorize/callback`. Its `scope` claim is `orders` only.
- Token B (basket scope, used only to read the result): the same flow with `client_id=basketswaggerui`, `scope=basket`, `redirect_uri=<BasketApiClient>/swagger/oauth2-redirect.html`.

## Steps

1. gRPC `BasketApi.Basket/UpdateBasket` on `url('basket')` with metadata `authorization: Bearer <token A>` and body `{ items: [{ product_id: 99, quantity: 2 }] }`.
2. gRPC `BasketApi.Basket/GetBasket` on `url('basket')` with metadata `authorization: Bearer <token B>` and body `{}`.

## Expected result

- Step 1 fails with gRPC status `PERMISSION_DENIED` (7); no `CustomerBasketResponse` is returned.
- Step 2 returns status `OK` with `items` empty (0 items): alice's basket was not written.
