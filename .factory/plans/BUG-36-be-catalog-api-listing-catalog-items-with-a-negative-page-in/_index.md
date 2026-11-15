---
story: BUG-36
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/126"
story-sha: c43a9ebf1436
plan-sha: 0b295b90ac5c
verified-score: 10
verified-at: "2026-11-15T09:47:17.306Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: 0fd761b3cdd2
automation-plan-sha: 0b295b90ac5c
automation-score: 10
automation-verified-at: "2026-11-15T13:46:33.142Z"
---
# Test plan: BUG-36 [BE - Catalog.API] - Listing catalog items with a negative page index or page size returns 500

Scope: `GET /api/catalog/items` on Catalog.API, in `api-version=1.0` and `api-version=2.0`, must answer `400 Bad Request` with a validation problem (`application/problem+json`) whose `errors` names `PageIndex` or `PageSize` when the page index or page size is negative, instead of `500` with an empty body. Requests with a page index of 0 or more and a page size of 1 or more keep returning `200` with the requested page. All cases run at the functional layer (Catalog API in-process against the fixture's real Postgres with the seeded 101-item catalog), the cheapest layer that exercises model binding, the endpoint pipeline and the database query together.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-36-01 | v1 list with pageIndex=-1 returns 400 naming PageIndex | sad | functional | Steps 1; Expected: 400 problem naming PageIndex |
| TC-BUG-36-02 | v1 list with pageSize=-1 returns 400 naming PageSize | sad | functional | Steps 2; Expected: 400 problem naming PageSize |
| TC-BUG-36-03 | v2 list with pageIndex=-1 returns 400 naming PageIndex | sad | functional | Steps 3; Expected: 400 problem naming PageIndex |
| TC-BUG-36-04 | v2 list with pageSize=-1 returns 400 naming PageSize | sad | functional | Steps 3; Expected: 400 problem naming PageSize |
| TC-BUG-36-05 | v1 list with pageIndex=-1 and pageSize=-1 names both parameters | sad | functional | Expected: problem names the parameter (each invalid one) |
| TC-BUG-36-06 | v1 list with pageIndex=0 and pageSize=1 still returns the first page | happy | functional | Expected: index 0 / size 1 behave as today (lower boundary inside) |
| TC-BUG-36-07 | v2 list with pageIndex=0 and pageSize=1 still returns the first page | happy | functional | Expected: index 0 / size 1 behave as today, v2 |
| TC-BUG-36-08 | v1 list with pageIndex=10 and pageSize=10 returns the last partial page | happy | functional | Expected: valid paging behaves as today (non-zero index) |

## Out of scope

- Other paginated routes that received the same filter per the Implementation Notes (`GET /api/catalog/items/by/{name}`, `/items/withsemanticrelevance...`, `/items/type/{typeId}/brand/{brandId}`, `/items/type/all/brand/{brandId}`): the bug report and its acceptance criteria name only `GET /api/catalog/items`.
- UI (WebApp) behaviour: the WebApp never sends negative paging; this is an API-only bug.
- OpenAPI documents (`Catalog.API.json`, `Catalog.API_v2.json`): the story states no contract change.

## Open questions

- `pageSize=0`: the Expected section guarantees today's behaviour only for a page size of 1 or more and requires `400` only for negative values. The Implementation Notes say 0 is now rejected with `400`, but the ticket does not state it, so no case asserts the result for `pageSize=0`.
- Exact error message text, `title` and `type` of the validation problem are not defined by the story; cases assert only status, content type, `status` field and the keys of `errors`.
- Non-numeric values (for example `pageIndex=abc`) and values beyond `int` range are not part of this bug.
