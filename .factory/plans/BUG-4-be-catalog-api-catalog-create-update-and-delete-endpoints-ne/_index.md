---
story: BUG-4
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/95"
story-sha: d68711f5c456
plan-sha: d99de51fa2f7
verified-score: 10
verified-at: "2026-11-14T22:17:58.106Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: d73af93b0e81
automation-plan-sha: d99de51fa2f7
automation-score: 9
automation-verified-at: "2026-11-14T22:35:04.564Z"
---
# Test plan: BUG-4 [BE - Catalog.API] - Catalog create, update and delete endpoints need no authentication

Scope: the four catalog write operations (`POST /api/catalog/items`, `PUT /api/catalog/items/{id}` (v2), `PUT /api/catalog/items` (v1), `DELETE /api/catalog/items/{id}`) must answer `401 Unauthorized` to callers without a valid bearer token and must leave the catalog unchanged; a price change attempted anonymously must not publish `ProductPriceChangedIntegrationEvent`. Callers with a token issued by Identity.API keep creating, updating and deleting items, and catalog reads stay anonymous. The anonymous and authenticated API cases run on the test stack (scenario `default`, catalog-api at `url('catalog')` from `e2e/teststack/ports.ts`), the layer the acceptance criteria name (`e2e/teststack/catalog-admin.spec.ts`), because the fix depends on the deployed JWT configuration (`Identity__Url` override, real Identity.API tokens) and the functional fixture (`CatalogApiFixture`) authenticates every request through `AutoAuthorizeStartupFilter`. Authenticated tokens are obtained as in `e2e/teststack/bug-15.spec.ts`: implicit flow of client `orderingswaggerui`, scope `orders`, signed in as `alice` / `Pass123$`.

Run order in the spec: TC-BUG-4-01 to 05 and 12 (anonymous, no state change), then 10, then 07 to 09. No happy case modifies item 1, so the anonymous cases' assertions on item 1 hold in any order.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-4-01 | Anonymous POST /api/catalog/items returns 401 and creates no item | sad | e2e | Steps to Reproduce 1; Expected 401; AC 1 |
| TC-BUG-4-02 | Anonymous v2 PUT /api/catalog/items/1 returns 401 and leaves item 1 unchanged | sad | e2e | Steps to Reproduce 2 (PUT); Expected 401; AC 1 |
| TC-BUG-4-03 | Anonymous v1 PUT /api/catalog/items returns 401 and leaves item 1 unchanged | sad | e2e | Technical Notes: UpdateItemV1 unprotected; Expected 401 |
| TC-BUG-4-04 | Anonymous DELETE /api/catalog/items/1 returns 401 and item 1 still exists | sad | e2e | Steps to Reproduce 2 (DELETE); Expected 401; AC 1 |
| TC-BUG-4-05 | POST with a malformed bearer token returns 401 and creates no item | sad | e2e | Expected 401 (caller not authenticated) |
| TC-BUG-4-06 | Anonymous price change publishes no ProductPriceChangedIntegrationEvent | sad | functional | Actual: price change publishes ProductPriceChangedIntegrationEvent |
| TC-BUG-4-07 | Authenticated POST creates an item (201 with Location) | happy | e2e | Expected: authorized callers can change the catalog; AC 2 (rest of the file passes) |
| TC-BUG-4-08 | Authenticated v2 PUT changes the price of item 99 (201) | happy | e2e | Expected: authorized callers can change the catalog |
| TC-BUG-4-09 | Authenticated DELETE removes item 101 (204, then 404) | happy | e2e | Expected: authorized callers can change the catalog |
| TC-BUG-4-10 | Catalog reads stay anonymous after the fix | happy | e2e | Implementation code map: reads unchanged and anonymous |
| TC-BUG-4-11 | Identity.API defines the catalog API resource and scope | happy | unit | Technical Notes: Identity.API has no catalog API scope |
| TC-BUG-4-12 | Anonymous DELETE of a missing item returns 401, not 404 | sad | e2e | Expected 401 for anonymous callers (before any lookup) |

## Out of scope

- `testing/flows/` bugs-table row removal and the `catalog-edge` scenario / `testing/teststack` script: they do not exist in this repository (dogfood copy, see story header and Deviations). The cases use scenario `default`.
- Removing a `test.fixme` marker: `e2e/teststack/catalog-admin.spec.ts` does not exist yet; feature verification writes it from this plan (cases 01 to 05, 07 to 10, 12).
- v1 `POST` and v1 `DELETE`: they are the same endpoint mappings (`api` group, versions 1.0 and 2.0) as the v2 calls in cases 01 and 04; the story's steps name `api-version=2.0` only.

## Open questions

- **Admin role:** Expected says "only an admin role can change the catalog", but Identity.API seeds no roles and the implementation allows any authenticated caller (Implementation Notes, Decisions). No case asserts that a non-admin user (`bob`) gets `403`; that belongs to the recorded follow-up. Cases 07 to 09 assert only that an authenticated caller is not rejected.
- **Scope / audience:** the story does not say whether a token must carry the `catalog` scope or audience. `AddDefaultAuthentication` sets `ValidateAudience = false`, and no Identity client is allowed the `catalog` scope, so the happy cases use an `orders`-scoped token. Whether a token without the `catalog` scope should be rejected is undefined.
- **401 response body and headers:** the story names only the status code; no case asserts a body or a `WWW-Authenticate` value.
- **Expired or wrongly signed tokens:** only a malformed token (case 05) is planned; the story defines no distinct behavior for expired tokens.
