---
story: BUG-4
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/95"
story-sha: d68711f5c456
automation-sha: 6da21b768df4
automation-plan-sha: 6989be9569f1
automation-score: 10
automation-verified-at: "2026-11-15T02:20:58.751Z"
plan-sha: 6989be9569f1
verified-score: 9
verified-at: "2026-11-15T01:50:12.001Z"
verified-by: test-planner@aebddb93/f37226b9
---
# Test plan: BUG-4 [BE - Catalog.API] - Catalog create, update and delete endpoints need no authentication

Scope: the four catalog write operations (`POST /api/catalog/items`, `PUT /api/catalog/items/{id}` (v2), `PUT /api/catalog/items` (v1), `DELETE /api/catalog/items/{id}`) must answer `401 Unauthorized` to callers without a valid bearer token, must refuse signed-in callers outside the admin role, and must leave the catalog unchanged in both cases; a price change attempted anonymously must not publish `ProductPriceChangedIntegrationEvent`. The admin keeps creating, updating and deleting items, and catalog reads stay anonymous. The API cases run on the test stack (catalog-api at `url('catalog')` from `e2e/teststack/ports.ts`), the layer the acceptance criteria name (`e2e/teststack/catalog-admin.spec.ts`), because the fix depends on the deployed JWT configuration (`Identity__Url` override) and on role claims in real Identity.API tokens; the functional fixture (`CatalogApiFixture`) authenticates every request, so it cannot observe these.

Test data: scenario `bug-4` (`.factory/stack/scenarios/bug-4`, `extends: default`) adds the role `Admin` (`AspNetRoles`) and the user `admin` / `Pass123$` in it (`AspNetUsers`, `AspNetUserRoles`); `alice` / `Pass123$` from `default` is the signed-in non-admin. Tokens come from `getAccessToken` in `e2e/teststack/identity-token.ts` through the implicit flow of client `catalogswaggerui` (scope `catalog`, redirect URI `http://catalog-api:8080/swagger/oauth2-redirect.html`).

Run order in the spec: TC-BUG-4-01 to 05, 12 and 13 to 16 (refused, no state change), then 10, then 07 to 09. No happy case modifies item 1, so the refused cases' assertions on item 1 hold in any order.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-4-01 | Anonymous POST /api/catalog/items returns 401 and creates no item | sad | e2e | Steps to Reproduce 1; Expected 401; AC 1 |
| TC-BUG-4-02 | Anonymous v2 PUT /api/catalog/items/1 returns 401 and leaves item 1 unchanged | sad | e2e | Steps to Reproduce 2 (PUT); Expected 401; AC 1 |
| TC-BUG-4-03 | Anonymous v1 PUT /api/catalog/items returns 401 and leaves item 1 unchanged | sad | e2e | Technical Notes: UpdateItemV1 unprotected; Expected 401 |
| TC-BUG-4-04 | Anonymous DELETE /api/catalog/items/1 returns 401 and item 1 still exists | sad | e2e | Steps to Reproduce 2 (DELETE); Expected 401; AC 1 |
| TC-BUG-4-05 | POST with a malformed bearer token returns 401 and creates no item | sad | e2e | Expected 401 (caller not authenticated) |
| TC-BUG-4-06 | Anonymous price change publishes no ProductPriceChangedIntegrationEvent | sad | functional | Actual: price change publishes ProductPriceChangedIntegrationEvent |
| TC-BUG-4-07 | Admin POST creates an item (201 with Location) | happy | e2e | Expected: only an admin role can change the catalog; AC 2 (rest of the file passes) |
| TC-BUG-4-08 | Admin v2 PUT changes the price of item 99 (201) | happy | e2e | Expected: only an admin role can change the catalog |
| TC-BUG-4-09 | Admin DELETE removes item 101 (204, then 404) | happy | e2e | Expected: only an admin role can change the catalog |
| TC-BUG-4-10 | Catalog reads stay anonymous after the fix | happy | e2e | Implementation code map: reads unchanged and anonymous |
| TC-BUG-4-11 | Identity.API defines the catalog API resource and scope | happy | unit | Technical Notes: Identity.API has no catalog API scope |
| TC-BUG-4-12 | Anonymous DELETE of a missing item returns 401, not 404 | sad | e2e | Expected 401 for anonymous callers (before any lookup) |
| TC-BUG-4-13 | Signed-in non-admin POST returns 403 and creates no item | sad | e2e | Expected: only an admin role can change the catalog |
| TC-BUG-4-14 | Signed-in non-admin v2 PUT returns 403 and leaves item 1 unchanged | sad | e2e | Expected: only an admin role can change the catalog; Actual: anyone can change prices |
| TC-BUG-4-15 | Signed-in non-admin v1 PUT returns 403 and leaves item 1 unchanged | sad | e2e | Expected: only an admin role; Technical Notes: UpdateItemV1 |
| TC-BUG-4-16 | Signed-in non-admin DELETE returns 403 and item 1 still exists | sad | e2e | Expected: only an admin role can change the catalog |

## Out of scope

- `testing/flows/` bugs-table row removal and the `catalog-edge` scenario / `testing/teststack` script: they do not exist in this repository (dogfood copy, see story header and Deviations). The cases use scenario `bug-4`, which extends `default`.
- Removing a `test.fixme` marker: `e2e/teststack/catalog-admin.spec.ts` does not exist yet; feature verification writes it from this plan (cases 01 to 05, 07 to 10, 12 to 16).
- The regenerated OpenAPI documents (`Catalog.API.json`, `Catalog.API_v2.json`) advertising 401/403 and oauth2 security: build output named only in the code map, not a behaviour a caller observes.
- v1 `POST` and v1 `DELETE`: they are the same endpoint mappings (`api` group, versions 1.0 and 2.0) as the v2 calls in cases 01, 04, 13 and 16; the story's steps name `api-version=2.0` only.

## Open questions

- **Admin role versus Implementation Notes:** Expected says "only an admin role can change the catalog"; the Implementation Notes' Decisions say the writes use the default policy (any authenticated caller) and defer the role to a follow-up. The notes do not narrow the ticket, so cases 07 to 09 and 13 to 16 plan the admin rule as written. The story does not name the role; the plan uses `Admin`, the name scenario `bug-4` seeds.
- **Status code for a signed-in non-admin:** Expected names only `401` for anonymous callers. Cases 13 to 16 assert `403`, the code the code map says the regenerated OpenAPI lists for the write operations; confirm this is the intended status.
- **Scope requirement:** the story adds a `catalog` scope (Technical Notes, Decisions) but does not say whether an admin token without it (for example scope `orders`) may write. No case asserts that.
- **401 response body and headers:** the story names only the status code; no case asserts a body or a `WWW-Authenticate` value.
- **Expired or wrongly signed tokens:** only a malformed token (case 05) is planned; the story defines no distinct behaviour for expired tokens.
- **Non-admin price change and the integration event:** case 06 checks only the anonymous price change; a non-admin's refused change (case 14) is checked through the stored price, not the event log.
