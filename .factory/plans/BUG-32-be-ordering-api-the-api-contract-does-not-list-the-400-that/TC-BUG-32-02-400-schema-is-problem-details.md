---
id: TC-BUG-32-02
type: sad
sad-path: validation
layer: functional
covers: ["Expected: 400 response with a problem details body"]
priority: P2
---

# TC-BUG-32-02: The 400 the OpenAPI document declares references the problem details schema

## Why

- The story requires the documented 400 to carry "a problem details body", not just a media type; an SDK generator uses the schema to build the error type, so a 400 entry with no or the wrong schema would still leave clients unable to read the error. It is separate from TC-BUG-32-01 because a document can list the media type with an empty schema. Functional for the same reason as TC-BUG-32-01: the schema is produced by the runtime OpenAPI generator.

## Preconditions

- Ordering.API is running in the functional fixture (`OrderingApiFixture`) and serves `/openapi/v1.json`.

## Steps

1. Send `GET /openapi/v1.json` to Ordering.API.
2. Read `paths["/api/orders/draft"].post.responses["400"].content["application/problem+json"].schema`.
3. Resolve its `$ref` (format `#/components/schemas/<Name>`) against `components.schemas` in the same document.

## Expected result

- The schema in step 2 has a `$ref` string that starts with `#/components/schemas/`.
- The component it names exists in `components.schemas`.
- That component's `properties` object contains the keys `type`, `title`, `status`, `detail` and `instance`.
