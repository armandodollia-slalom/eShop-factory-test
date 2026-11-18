---
story: BUG-51
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/266"
story-sha: 78ccbfb5d7f5
plan-sha: bd4bc9645111
verified-score: 10
verified-at: "2026-11-18T06:43:14.439Z"
verified-by: test-planner@6ab9e852/council
automation-sha: 12b00b3d4852
automation-plan-sha: bd4bc9645111
automation-score: 9
automation-verified-at: "2026-11-18T06:57:23.236Z"
---
# Test plan: BUG-51 [FE - WebApp] - A catalog page number past the last page shows a product count above an empty page

Scope: the catalog page (`/`) of the WebApp when its `page` query value is past the last page of the current result. The default catalog has 101 products at 9 per page, so its last page is 12. A page past the end must show the last page of the current (filtered or unfiltered) result, with the pager never reading a current page above the number of pages. Pages 1 to 12, and filtered pages within range, must behave as before. All cases run on the `e2e` layer through the WebApp on the test stack: the defect and the fix live in the Blazor page's rendering (`Catalog.razor`), which no unit or functional test project exercises. Seed data: scenario `default` (Gravitator, brand 2: 11 products; Solstix, brand 7: 9 products; XE, brand 13: 3 products; Ski/boarding, type 3: 18 products; Cycling, type 8: 9 products, none of brand 13).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-51-01 | The catalog's last page /?page=12 lists 2 products with the pager at "12 / 12" | happy | e2e | Steps to Reproduce step 1; Expected: pages 1 to 12 behave as today |
| TC-BUG-51-02 | /?page=1 lists 9 products with the pager at "1 / 12" | happy | e2e | Expected: pages 1 to 12 behave as today |
| TC-BUG-51-03 | /?page=50 shows the catalog's last page with the pager at "12 / 12" | sad (boundary) | e2e | Steps to Reproduce step 2; Expected bullet 1; Expected bullet 2 (unfiltered); Actual |
| TC-BUG-51-04 | /?page=13, one past the last page, shows the last page | sad (boundary) | e2e | Expected bullet 2 (unfiltered, just outside the limit) |
| TC-BUG-51-05 | /?page=2147483647 shows the last page | sad (boundary) | e2e | Expected bullet 2 (largest page value) |
| TC-BUG-51-06 | A brand filter past its last page shows that filter's last page | sad (boundary) | e2e | Expected bullet 2 (brand filter); Expected bullet 3 (brand filter in range) |
| TC-BUG-51-07 | A type filter past its last page shows that filter's last page | sad (boundary) | e2e | Expected bullet 2 (type filter); Expected bullet 3 (type filter in range) |
| TC-BUG-51-08 | A one-page brand filter with a page past the end shows its products and no pager | sad (boundary) | e2e | Expected bullet 2 (filter with a single page) |
| TC-BUG-51-09 | A filter matching nothing with a page past the end keeps the no-products state | sad (boundary) | e2e | Expected bullet 3 (filtered catalog behaves as today) |

## Out of scope

- Page numbers below 1 (`/?page=0`, `/?page=-3`): the ticket does not cover them and the implementation leaves them unchanged.
- The address after a past-the-end page: the ticket does not say whether the URL is rewritten, so no case asserts it.
- Catalog API paging (`/api/catalog/items`): unchanged by this bug.

## Open questions

- Non-numeric or out-of-int-range page values (`/?page=abc`, `/?page=99999999999`): the ticket does not say what they should show; no case.
- Page numbers below 1: undefined by the ticket (see Out of scope).
- Whether the address bar should be rewritten to the last page's URL: the ticket only defines what the page shows; the cases do not assert the URL.
