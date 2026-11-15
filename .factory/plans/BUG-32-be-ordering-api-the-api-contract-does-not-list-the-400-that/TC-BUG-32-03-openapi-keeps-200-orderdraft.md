---
id: TC-BUG-32-03
type: happy
layer: functional
covers: ["Expected: The endpoint's behaviour is unchanged (contract side)", "Deviations: Ok<OrderDraftDTO> still supplies the 200 response"]
priority: P2
---

# TC-BUG-32-03: OpenAPI document still lists the 200 application/json OrderDraftDTO response for POST /api/orders/draft

## Why

- Adding explicit response metadata (`.ProducesProblem`) to an endpoint can change how the generator merges the `Results<...>` union's metadata; if the 200 entry disappeared or lost its schema, the fix would trade one contract gap for a worse one. The story says the endpoint is otherwise unchanged, so its documented success response must still be there. Functional because only the running generator produces the document.

## Preconditions

- Ordering.API is running in the functional fixture (`OrderingApiFixture`) and serves `/openapi/v1.json`.

## Steps

1. Send `GET /openapi/v1.json` to Ordering.API.
2. Read `paths["/api/orders/draft"].post.responses["200"]`.
3. Resolve `content["application/json"].schema.$ref` against `components.schemas`.

## Expected result

- `paths["/api/orders/draft"].post.responses` has a key `"200"`.
- `responses["200"].content` has a key `"application/json"`.
- The schema's `$ref` is `#/components/schemas/OrderDraftDTO` and that component exists in `components.schemas` with the properties `orderItems` and `total`.
