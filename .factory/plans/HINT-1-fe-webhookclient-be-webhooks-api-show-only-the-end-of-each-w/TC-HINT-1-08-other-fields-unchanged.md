---
id: TC-HINT-1-08
type: happy
layer: functional
covers: ["AC1: GET /api/webhooks and GET /api/webhooks/{id} have no token, have tokenHint", "AC2: token longer than 4 characters", "AC3: id, type, date, destUrl, userId returned as today", "AC3: status codes unchanged (200)"]
priority: P1
---

# TC-HINT-1-08: List and single answers carry tokenHint instead of token and keep id, type, date, destUrl and userId with their values

## Why

- AC1 is the point of the story (neither read endpoint may expose a token) and AC3 says the new response model must not drop or rename existing fields; the webhooks client depends on `date` and `destUrl`. Both endpoints map their own response, so each is checked. The body is inspected as raw JSON at the functional layer (Webhooks API in-process against real Postgres) because deserializing into a typed model would hide a leftover `token` property.

## Preconditions

- Caller `X-Test-User: hint1-fields-<guid>`; note the UTC time `T0` just before registering.
- The caller registered via `POST /api/webhooks/` body `{"url":"https://receiver.test/fields","grantUrl":"https://receiver.test/check","token":"fake-token-for-tests","event":"OrderPaid"}` → 201, `Location: /api/webhooks/<id>`; note `T1` just after.

## Steps

1. `GET /api/webhooks/` as `hint1-fields-<guid>`; read the body as raw JSON.
2. `GET /api/webhooks/<id>` as `hint1-fields-<guid>`; read the body as raw JSON.

## Expected result

- Both return 200. The list body is a JSON array with exactly 1 element; the single body is a JSON object. Each carries exactly the properties `id`, `type`, `date`, `destUrl`, `tokenHint`, `userId` (no others; in particular no property named `token`, compared case-insensitively).
- The string `fake-token-for-tests` does not appear anywhere in either response body.
- In both: `id` = `<id>`; `type` = `3` (OrderPaid, serialized as today's number); `destUrl` = `"https://receiver.test/fields"`; `userId` = `"hint1-fields-<guid>"`; `date` is between `T0` and `T1`; `tokenHint` = `"…ests"` (U+2026 followed by `ests`, 5 characters in total).
- The list element and the single answer are equal field by field.
