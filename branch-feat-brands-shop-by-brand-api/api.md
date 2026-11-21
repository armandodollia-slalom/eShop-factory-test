<!-- head: 5f8c7ed40152ef4025413747526d533ee1079d16 -->
## API changes

HTTP endpoints this PR adds, changes or removes (read by the `aspnet-minimal-api` route extractor), documented from OpenAPI and illustrated with the calls its e2e specs made (commit 5f8c7ed).

| Change | Method | Endpoint | Service | Request | Responses | Recorded calls |
| --- | --- | --- | --- | --- | --- | --- |
| 🆕 Added | `GET` | `/api/catalog/catalogbrands/summary` | catalog-api |  | 200, 400 |  |

### `GET /api/catalog/catalogbrands/summary`

🆕 Added in `src/Catalog.API/Apis/CatalogApi.cs:103` · API versions 1.0, 2.0

List catalog brand summaries

**Parameters:** `sort` (query, string), `api-version` (query, string, required)

**Responses:** `200` `CatalogBrandSummary[]` OK · `400` `ProblemDetails` Bad Request

<sub>Updated by `.github/workflows/factory-pr-demo-video.yml` on every push; edits inside this section are overwritten. Secrets in recorded calls are redacted and long bodies truncated.</sub>
