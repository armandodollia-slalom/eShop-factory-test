---
id: TC-BUG-33-07
type: happy
layer: e2e
covers: ["Acceptance criteria: Given the test stack is running, When the steps are repeated, Then the result matches Expected", "Steps to Reproduce: steps 1-3", "Expected: the shopping bag shows product 1 once, with quantity 3 and the matching total"]
priority: P1
---

# TC-BUG-33-07: Shopping bag shows product 1 once with quantity 3 and total $329.97 after a duplicate-entry update as bob

## Why

- The acceptance criterion is the reproduction on the running test stack, ending in what `bob` sees in the shopping bag. Only e2e covers the real token, the deployed Basket.API, Redis and the WebApp rendering together. 109.99 × 3 = 329.97 is the "matching total".

## Preconditions

- Test stack running with scenario `default` (seeded user `bob` / `Pass123$`, id `bc8b0071-21af-41ab-b1d2-15c4efc368df`; product 1 "Wanderer Black Hiking Boots" at 109.99).
- `bob` has no stored basket (call gRPC `Basket.DeleteBasket` with bob's token before step 2).

## Steps

1. Get an access token for `bob` with scope `basket`: open Identity's `/connect/authorize` with `client_id=basketswaggerui`, `response_type=token`, `scope=basket`, `redirect_uri=http://basket-api:8080/swagger/oauth2-redirect.html` (the `BasketApiClient` value in `.factory/stack/docker-compose.yaml`), sign in as `bob` / `Pass123$`, and read `access_token` from the redirect fragment.
2. Call gRPC `Basket.UpdateBasket` on Basket.API with header `Authorization: Bearer <token>` and body `{ "items": [ { "productId": 1, "quantity": 1 }, { "productId": 1, "quantity": 2 } ] }`.
3. Call gRPC `Basket.GetBasket` with the same header and body `{}`.
4. In a new browser context, sign in to the WebApp as `bob` / `Pass123$` and open `/cart`.

## Expected result

- Step 2 returns gRPC status OK.
- Step 3 returns exactly 1 item: `productId` = 1, `quantity` = 3.
- On `/cart` there is exactly 1 `.cart-item` element.
- That `.cart-item` has `.name` text `Wanderer Black Hiking Boots`, the input labelled `Quantity of Wanderer Black Hiking Boots` has value `3`, and its `.catalog-item-total` text is `$329.97`.
- The `.cart-summary-header .filter-badge` text is `3` and the `.cart-summary-total` shows `$329.97`.
