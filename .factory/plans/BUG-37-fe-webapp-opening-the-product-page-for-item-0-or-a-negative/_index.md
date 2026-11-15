---
story: BUG-37
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/127"
story-sha: 6308c0dee2a6
plan-sha: 4bcbbea57d80
verified-score: 10
verified-at: "2026-11-15T09:51:46.103Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: 3cad65d21d98
automation-plan-sha: 4bcbbea57d80
automation-score: 10
automation-verified-at: "2026-11-15T10:28:01.254Z"
---
# Test plan: BUG-37 Opening the product page for item 0 or a negative id shows a server error

Scope: the WebApp product page route `/item/{itemId:int}` on the test stack (scenario `default`). `/item/0` and `/item/-1` must answer exactly as an unknown id (`/item/999999`) does: HTTP status `404` and the same "Not found" page. The product page of an existing product keeps answering `200` with the product. All cases are e2e (Playwright in `e2e/teststack/`, anonymous visitor): the bug and its acceptance criterion are about the HTTP status and page the WebApp serves, which only a request through the running WebApp shows. Each case loads the page with `page.goto(<url>)` and reads the status from the returned response.

The "Not found" page that every not-found case checks (the same assertions in TC-BUG-37-01, -02 and -03, so "the same page" is checked value by value):

- response status `404`
- the header `h1` text is `Not found`
- `.item-page .item-notfound` text is `Sorry, we couldn't find any such product.`
- `.item-page a.item-back` is visible with text `Back to catalog`
- the page has no `.item-details` element and no `form.add-to-cart` element
- the page shows no text `Internal Server Error`

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-37-01 | Unknown product id 999999 answers 404 with the Not found page | sad | e2e | Steps to Reproduce step 1 (baseline); Expected: reference page |
| TC-BUG-37-02 | Product id 0 answers 404 with the same Not found page | sad | e2e | Steps to Reproduce step 2; Expected; Acceptance Criteria |
| TC-BUG-37-03 | Product id -1 answers 404 with the same Not found page | sad | e2e | Steps to Reproduce step 3; Expected; Acceptance Criteria |
| TC-BUG-37-04 | Existing product id 1 still answers 200 with its product page | happy | e2e | Expected: existing products behave as today; boundary just inside |

## Out of scope

- Catalog.API's own answer for non-positive ids (`GET /api/catalog/items/0` answers 400): the story says it is unchanged and the bug is in the WebApp only.
- Non-numeric ids such as `/item/abc`: the route constraint `{itemId:int}` does not match them, and the story does not mention them.
- The product page's other features (add to basket, brand mates, image zoom, back link targets): unchanged by this bug and covered by their own stories' tests.

## Open questions

- Ids below -1 (for example `/item/-2147483648`) and ids above the int range are not named by the story. The story's reading "0 or a negative id" implies every negative id answers 404; the plan checks the two ids the story names (0 and -1) and 1 as the positive boundary.
- The story does not say whether the response for 0 and -1 must also be identical for a signed-in user; the plan uses an anonymous visitor, as the reproduction steps do.
