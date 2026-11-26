---
story: BUG-6
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/96"
story-sha: 411b722c88f8
plan-sha: 28ec2d26dd9a
verified-score: 9
verified-at: "2026-11-14T22:12:16.029Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: a5354f726d87
automation-plan-sha: 28ec2d26dd9a
automation-score: 10
automation-verified-at: "2026-11-14T22:25:52.085Z"
---
# Test plan: BUG-6 Basket.API accepts access tokens issued without the basket scope

Scope: authorization of the Basket.API gRPC service (`BasketApi.Basket`). `UpdateBasket` and `DeleteBasket` must reject any caller whose access token does not carry the `basket` scope, before the handler runs, so nothing is written to or deleted from Redis. Tokens that carry `basket` (as one `scope` claim per scope, or as one space-separated `scope` value) keep working, and anonymous `GetBasket` still returns an empty basket. Two e2e cases repeat the story's reproduction with real Identity.API tokens on the test stack; the rest are functional cases in `tests/Basket.FunctionalTests` that host Basket.API in-process (`WebApplicationFactory`) against the real Redis from `RedisFixture`, with a test authentication handler that issues a principal with a chosen `sub` and chosen `scope` claims, so each scope shape and the Redis state can be checked exactly.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-6-01 | Real Identity token with only the orders scope cannot update alice's basket | sad | e2e | Steps to Reproduce; Expected; Acceptance Criteria 1 |
| TC-BUG-6-02 | Real Identity token with the basket scope updates alice's basket | happy | e2e | Decisions: token with basket scope works as before |
| TC-BUG-6-03 | UpdateBasket with scope "orders" only is denied and Redis is unchanged | sad | functional | Expected: rejected, nothing written to Redis |
| TC-BUG-6-04 | UpdateBasket from an authenticated principal with no scope claim is denied | sad | functional | Decisions: BasketScope policy requires a basket scope claim |
| TC-BUG-6-05 | DeleteBasket with scope "orders" only is denied and the basket stays in Redis | sad | functional | Decisions: DeleteBasket rejected before the handler runs |
| TC-BUG-6-06 | UpdateBasket with one scope claim per scope including basket succeeds | happy | functional | Decisions: scope matching, JSON array shape |
| TC-BUG-6-07 | UpdateBasket with one space-separated scope value including basket succeeds | happy | functional | Decisions: scope matching, space-separated shape |
| TC-BUG-6-08 | Scope value "baskets" does not satisfy the basket scope | sad | functional | Decisions: scope claims contain `basket` (exact scope match) |
| TC-BUG-6-09 | UpdateBasket without any token is rejected as unauthenticated | sad | functional | Decisions: policy requires an authenticated user; Expected UNAUTHENTICATED |
| TC-BUG-6-10 | DeleteBasket with the basket scope removes the caller's basket | happy | functional | Decisions: DeleteBasket with basket scope works as before |
| TC-BUG-6-11 | Anonymous GetBasket still returns an empty basket | happy | functional | Decisions: GetBasket keeps [AllowAnonymous] |

## Test data

- e2e: new scenario `bug-6` (`extends: default`, no extra rows): alice and bob (`Pass123$`) with empty baskets. Tokens come from Identity.API's implicit-flow clients `orderingswaggerui` (scope `orders`) and `basketswaggerui` (scope `basket`).
- functional: each case seeds its own Redis key `/basket/user-bug6-NN` through `RedisBasketRepository`, so cases do not share state.

## Out of scope

- Removing `test.fixme` from `e2e/teststack/basket-api.spec.ts`, the helper `e2e/teststack/auth-basket-helpers.ts`, the `basket-edge` scenario, `testing/teststack` and the bugs table in `testing/flows/`: none of these exist in this repository (story header and Deviations). The reproduction is covered by TC-BUG-6-01 on the existing test stack with the `bug-6` scenario.
- Identity.API changes: the story's decisions leave `src/Identity.API` and `src/eShop.ServiceDefaults` unchanged; Identity's scope definitions and clients are only used as token sources.
- The `OrderStartedIntegrationEvent` handler that deletes a basket: it does not go through gRPC authorization and is unchanged.

## Open questions

- The story's Expected allows `UNAUTHENTICATED` or `PERMISSION_DENIED`. The cases assert the status the chosen design produces: an authenticated token that fails the `BasketScope` policy is forbidden (HTTP 403, gRPC `PERMISSION_DENIED`), and a call with no token is challenged (HTTP 401, gRPC `UNAUTHENTICATED`). If the product owner wants `UNAUTHENTICATED` for a token without the scope, TC-BUG-6-01, -03, -04, -05 and -08 change.
- `GetBasket` keeps `[AllowAnonymous]`, so a token without the `basket` scope (for example alice's `orders`-only token) still authenticates and reads alice's basket. The story only states that anonymous callers get an empty basket; whether reading with a non-basket token must be refused is not defined. No case written.
- The story names scopes `openid profile orders` for the reproduction token. On the test stack no Identity client issues exactly that set to a browser-reachable flow; `orderingswaggerui` (implicit flow) issues `orders` only. TC-BUG-6-01 uses that token; the missing `basket` scope is what matters.
- Exact error message text (`Status.Detail`) of the rejected calls is not defined; cases assert only the status code.
- Concurrency and Redis outages are not mentioned by the story. No case written.
