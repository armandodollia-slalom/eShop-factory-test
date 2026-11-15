---
story: BUG-32
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/111"
story-sha: 83dd61f37dd7
plan-sha: 71f18a897f7e
verified-score: 10
verified-at: "2026-11-15T05:24:43.338Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: c7b7f7150988
automation-plan-sha: 71f18a897f7e
automation-score: 9
automation-verified-at: "2026-11-15T05:50:01.436Z"
---
# Test plan: BUG-32 [BE - Ordering.API] - The API contract does not list the 400 that creating an order draft can return

Scope: the OpenAPI document Ordering.API serves at `GET /openapi/v1.json` and the operation `POST /api/orders/draft`. The document must list a `400` response with an `application/problem+json` body for that operation, matching what the endpoint actually returns for a draft with no items, and the endpoint's runtime behaviour (400 for an item-less draft, 200 with the draft for a valid one) must stay unchanged. All cases are functional (`tests/Ordering.FunctionalTests`, existing `OrderingApiFixture`): the OpenAPI document is mapped because `src/Ordering.API/appsettings.json` has an `OpenApi` section, and the fixture runs the same application the test stack runs, so this is the cheapest layer that serves both the contract and the endpoint.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-32-01 | OpenAPI document lists a 400 application/problem+json response for POST /api/orders/draft | sad | functional | Expected: document lists 400 with problem details body; Steps to Reproduce step 1 |
| TC-BUG-32-02 | The 400 the OpenAPI document declares references the problem details schema | sad | functional | Expected: "with a problem details body" |
| TC-BUG-32-03 | OpenAPI document still lists the 200 application/json OrderDraftDTO response for POST /api/orders/draft | happy | functional | Expected: endpoint behaviour unchanged (contract side); Deviations: `Ok<OrderDraftDTO>` still supplies 200 |
| TC-BUG-32-04 | Draft with no items still returns 400 application/problem+json, matching the documented response | sad | functional | Steps to Reproduce step 2; Expected: "matching what step 2 returns"; behaviour unchanged |
| TC-BUG-32-05 | Draft with one item still returns 200 with the order draft | happy | functional | Expected: "The endpoint's behaviour is unchanged" |

## Out of scope

- Unauthenticated callers (401) and authorization of `POST /api/orders/draft`: the story does not change authorization, does not ask for a 401 in the document, and the functional fixture auto-authorizes every request.
- Responses of the other Ordering.API operations in the document: the story names only `POST /api/orders/draft`.
- Missing body, `{}` and `"items": null` rejections: these 400 paths were planned and automated under BUG-15 (TC-BUG-15-01 to TC-BUG-15-05) and this story does not change them; TC-BUG-32-04 re-checks the item-less path the story reproduces.
- e2e (Playwright): the change is to the API contract only; nothing a user sees in the browser changes.

## Open questions

- The story says "a problem details body" without naming the schema. TC-BUG-32-02 asserts the most literal reading: the `application/problem+json` content of the 400 has a schema whose `$ref` resolves to a component in `components.schemas` that declares the properties `type`, `title`, `status`, `detail` and `instance`. The exact component name (`ProblemDetails` in ASP.NET Core's generator) is not stated and is not asserted.
- The story does not say whether the 400 response's `description` text in the document must have a particular value; no case asserts it.
