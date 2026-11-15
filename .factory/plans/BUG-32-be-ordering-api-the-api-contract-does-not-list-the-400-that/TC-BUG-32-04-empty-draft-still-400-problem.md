---
id: TC-BUG-32-04
type: sad
sad-path: validation
layer: functional
covers: ["Steps to Reproduce step 2", "Expected: matching what step 2 returns", "Expected: The endpoint's behaviour is unchanged"]
priority: P1
---

# TC-BUG-32-04: Draft with no items still returns 400 application/problem+json, matching the documented response

## Why

- The story's Expected says the documented 400 must match what step 2 returns, and the endpoint's behaviour must not change; this case pins the runtime side of that match (status, media type, problem fields) so a change that edits the handler while fixing the contract is caught. Functional because the status code and content type come from the real HTTP pipeline.

## Preconditions

- Ordering.API is running in the functional fixture (`OrderingApiFixture`), which authenticates every request as a signed-in user.
- Buyer id used in the body: `9e3163b9-1ae6-4652-9dc6-7898ab7b7a00`.

## Steps

1. Send `POST /api/orders/draft?api-version=1.0` with header `Content-Type: application/json` and body `{"buyerId":"9e3163b9-1ae6-4652-9dc6-7898ab7b7a00","items":[]}`.

## Expected result

- Status `400 Bad Request`.
- Response `Content-Type` media type is `application/problem+json`, the media type TC-BUG-32-01 asserts in the document.
- The JSON body has `status` equal to `400` and `detail` equal to `The order draft must contain at least one item.`.
- The JSON body has a non-empty string `title`.
