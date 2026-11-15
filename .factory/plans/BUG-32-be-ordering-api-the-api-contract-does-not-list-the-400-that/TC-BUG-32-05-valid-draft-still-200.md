---
id: TC-BUG-32-05
type: happy
layer: functional
covers: ["Expected: The endpoint's behaviour is unchanged"]
priority: P2
---

# TC-BUG-32-05: Draft with one item still returns 200 with the order draft

## Why

- The story requires the endpoint's behaviour to stay unchanged; the success path is the behaviour most clients depend on, and a fix that touches the endpoint mapping could break it (for example by altering how the body binds). Functional because it needs the real binding, MediatR handler and serialization.

## Preconditions

- Ordering.API is running in the functional fixture (`OrderingApiFixture`), which authenticates every request as a signed-in user.
- Buyer id used in the body: `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`.

## Steps

1. Send `POST /api/orders/draft?api-version=1.0` with header `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[{"id":"1","productId":1,"productName":"Test item","unitPrice":10.50,"oldUnitPrice":0,"quantity":2,"pictureUrl":""}]}`.

## Expected result

- Status `200 OK`.
- Response `Content-Type` media type is `application/json`.
- The body's `orderItems` array has exactly 1 element, with `productId` `1` and `units` `2`.
- The body's `total` is `21.0`.
