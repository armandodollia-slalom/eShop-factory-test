---
id: TC-BUG-32-01
type: sad
sad-path: validation
layer: functional
covers: ["Expected: OpenAPI document lists a 400 response for POST /api/orders/draft with application/problem+json", "Steps to Reproduce step 1", "Acceptance Criteria"]
priority: P1
---

# TC-BUG-32-01: OpenAPI document lists a 400 application/problem+json response for POST /api/orders/draft

## Why

- This is the defect itself: the served contract omitted the 400 that the draft endpoint returns for an item-less draft, so clients and generated SDKs did not know the validation error exists. It is a functional case because the document is generated at runtime from endpoint metadata (`.ProducesProblem(400)` on the mapping), which only a running app with the real OpenAPI pipeline produces; a unit test of the handler cannot see it.

## Preconditions

- Ordering.API is running in the functional fixture (`OrderingApiFixture`) with its `src/Ordering.API/appsettings.json`, which contains the `OpenApi` section, so `MapOpenApi()` serves `/openapi/v1.json`.

## Steps

1. Send `GET /openapi/v1.json` (no body, no `api-version` query string) to Ordering.API.
2. Parse the response body as JSON and read `paths["/api/orders/draft"].post.responses`.

## Expected result

- Step 1 returns `200` and a JSON body.
- `paths["/api/orders/draft"]` exists and has a `post` operation.
- `paths["/api/orders/draft"].post.responses` has a key `"400"`.
- `paths["/api/orders/draft"].post.responses["400"].content` has a key `"application/problem+json"`.
