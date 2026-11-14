---
id: TC-BUG-6-02
type: happy
layer: e2e
covers: ["Decisions: token with basket scope works as before", "Code map: Token with basket scope works as before"]
priority: P0
---

# TC-BUG-6-02: Real Identity token with the basket scope updates alice's basket

## Why

- The fix must not lock out legitimate callers. The risk is that the scope check does not recognise the `scope` claim shape that Identity.API actually emits (Duende writes a JSON array of `scope` values), which would break every basket write in the WebApp. Only a real Identity token on the test stack shows that shape; a synthetic principal cannot.

## Preconditions

- Test stack up with scenario `bug-6` (alice's basket empty).
- Token B: implicit-flow sign-in as alice (`Pass123$`) with `client_id=basketswaggerui`, `response_type=token`, `scope=basket`, `redirect_uri=<BasketApiClient>/swagger/oauth2-redirect.html`; `access_token` read from the 302 `Location` fragment of `/connect/authorize/callback`.

## Steps

1. gRPC `BasketApi.Basket/UpdateBasket` on `url('basket')` with metadata `authorization: Bearer <token B>` and body `{ items: [{ product_id: 99, quantity: 2 }] }`.
2. gRPC `BasketApi.Basket/GetBasket` on `url('basket')` with metadata `authorization: Bearer <token B>` and body `{}`.
3. Cleanup: gRPC `BasketApi.Basket/DeleteBasket` with token B.

## Expected result

- Step 1 returns status `OK` with `items` = `[{ product_id: 99, quantity: 2 }]`.
- Step 2 returns status `OK` with `items` = `[{ product_id: 99, quantity: 2 }]`.
