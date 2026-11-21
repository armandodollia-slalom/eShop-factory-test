<!-- head: 028156176d87b1247be007673f913f0cc0d0a0ec -->
## API changes

HTTP endpoints this PR adds, changes or removes (read by the `aspnet-minimal-api` route extractor), documented from OpenAPI and illustrated with the calls its e2e specs (`e2e/teststack/bug-52.spec.ts`, `e2e/teststack/hint-1.spec.ts`) made (commit 0281561, [workflow run](https://github.com/armandodollia-slalom/eShop-factory-test/actions/runs/44414285678)).

| Change | Method | Endpoint | Service | Request | Responses | Recorded calls |
| --- | --- | --- | --- | --- | --- | --- |
| ✏️ Changed | `GET` | `/api/webhooks` | webhooks-api |  | 200, 401, 403 | 1 (401) |
| ✏️ Changed | `GET` | `/api/webhooks/{id}` | webhooks-api |  | 200, 401, 403, 404 | 1 (401) |

### `GET /api/webhooks`

✏️ Changed in `src/Webhooks.API/Apis/WebHooksApi.cs:13` · API versions 1.0

**Parameters:** `api-version` (query, string, required)

**Responses:** `200` `WebhookSubscriptionResponse[]` OK · `401` Unauthorized · `403` Forbidden

<details><summary>Example: <code>401</code> · TC-HINT-1-11 GET /api/webhooks without a bearer token is still refused with 401</summary>

**Request**

```http
GET /api/webhooks?api-version=1.0
```

**Response** `401`

_(empty body)_

</details>

### `GET /api/webhooks/{id}`

✏️ Changed in `src/Webhooks.API/Apis/WebHooksApi.cs:20` · API versions 1.0

**Parameters:** `id` (path, integer(int32), required), `api-version` (query, string, required)

**Responses:** `200` `WebhookSubscriptionResponse` OK · `401` Unauthorized · `403` Forbidden · `404` `string` Not Found

<details><summary>Example: <code>401</code> · TC-HINT-1-11 GET /api/webhooks without a bearer token is still refused with 401</summary>

**Request**

```http
GET /api/webhooks/9101?api-version=1.0
```

**Response** `401`

_(empty body)_

</details>

<sub>Updated by `.github/workflows/factory-pr-demo-video.yml` on every push; edits inside this section are overwritten. Secrets in recorded calls are redacted and long bodies truncated.</sub>
