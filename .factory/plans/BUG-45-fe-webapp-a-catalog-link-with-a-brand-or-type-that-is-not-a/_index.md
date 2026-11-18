---
story: BUG-45
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/217"
story-sha: 8d91073036e5
plan-sha: 4623f2c63cd1
verified-score: 10
verified-at: "2026-11-17T08:42:17.027Z"
verified-by: test-planner@6ab9e852/council
automation-sha: 6c4efae4a20f
automation-plan-sha: 4623f2c63cd1
automation-score: 10
automation-verified-at: "2026-11-17T08:51:11.851Z"
---
# Test plan: BUG-45 A catalog link with a brand or type that is not a number shows a blank error page

Bug fix in the WebApp catalog page (`/`): a `brand` or `type` query value that is not a number (text, or an empty value) must be ignored instead of failing the page with HTTP 500, and the remaining numeric values must still filter. Links with only numeric values must behave as today. Every case is a Playwright e2e spec on the test stack (scenario `default`: 101 products, brand id 1 is Daybird with 10 products, type id 7 is Navigation with 11 products), opened anonymously. The failure is in the WebApp's query binding, which only the rendered page exercises, and the WebApp has no unit or functional test project. Each case is one URL: a step from the bug's Steps to Reproduce, the `/?type=7` comparison link that Expected names, or the empty `type` value that the Bug Report names alongside the empty `brand` value of step 5.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-45-01 | `/?brand=abc` shows the whole catalog with brand "All" selected | sad | e2e | Steps 1; Expected: steps 1-5 open the catalog (HTTP 200, header, filters, list); steps 1, 2, 5 show "101 products" with "All" selected |
| TC-BUG-45-02 | `/?type=abc` shows the whole catalog with type "All" selected | sad | e2e | Steps 2; Expected: steps 1-5 open the catalog; steps 1, 2, 5 show "101 products" with "All" selected |
| TC-BUG-45-03 | `/?brand=1&brand=abc` ignores "abc" and shows Daybird's 10 products | sad | e2e | Steps 3; Expected: non-numeric value ignored, other values still apply; step 3 shows "10 products" with Daybird selected |
| TC-BUG-45-04 | `/?type=7&type=x` ignores "x" and shows the 11 Navigation products | sad | e2e | Steps 4; Expected: non-numeric value ignored, other values still apply; step 4 shows "11 products" with Navigation selected |
| TC-BUG-45-05 | `/?brand=` (empty value) shows the whole catalog with brand "All" selected | sad | e2e | Steps 5; Expected: steps 1-5 open the catalog; steps 1, 2, 5 show "101 products" with "All" selected |
| TC-BUG-45-06 | `/?brand=1` still shows Daybird's 10 products | happy | e2e | Steps 6; Expected: links with only numeric values work as today |
| TC-BUG-45-07 | `/?type=7` still shows the 11 Navigation products | happy | e2e | Expected: step 4 is "the same as `/?type=7`"; links with only numeric values work as today |
| TC-BUG-45-08 | `/?type=` (empty value) shows the whole catalog with type "All" selected | sad | e2e | Bug Report: "a brand or type value ... or an empty value"; Expected: a value that is not a number is ignored; whole catalog "101 products" with "All" selected in that filter |

## Out of scope

- `page=abc` (and any other query parameter than `brand` and `type`): the story's Implementation Notes leave it as a follow-up and the ticket does not mention it.
- Unit and functional layers: the Catalog API, its contract and its filtering are unchanged; the defect and fix live only in the WebApp page's query binding.

## Open questions

- Values that are numeric but name no brand or type (for example `/?brand=999`), negative numbers, or values beyond the `int` range are not described by the ticket; no case is written.
