---
story: BUG-7
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/17"
story-sha: 8607f9cfdf27
plan-sha: 5e90b09d8ed0
verified-score: 9
verified-at: "2026-11-13T07:31:27.112Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: ce936c689e61
automation-plan-sha: 5e90b09d8ed0
automation-score: 10
automation-verified-at: "2026-11-13T07:46:03.888Z"
---
# Test plan: BUG-7 [FE - WebApp] - A basket line for a product no longer in the catalog breaks every page

Scope: a user whose Redis basket holds a line for a product that is not in the catalog (`99999`) must still be able to use every page; the missing line is dropped or flagged and the rest of the basket is shown. All cases are `e2e` (the story's test is a Playwright test on the test stack) and need a new test stack scenario `bug-7` that `extends: default`, adds users `oscar` (only 99999), `olive` (99999 plus product 99 x2) and seeds `bob` with a two-line valid basket; each case uses its own user so seeded baskets never overlap, and `alice` stays empty. Spec file: `e2e/teststack/basket-cart.spec.ts`.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-7-01 | A page renders and the cart menu does not count the missing product | sad | e2e | Expected: the site works; cart drops/flags the missing product |
| TC-BUG-7-03 | Cart page shows the valid lines and omits the missing product | sad | e2e | Expected: rest of basket shown |
| TC-BUG-7-04 | Cart page shows the empty-cart state when the only line is missing | sad | e2e | Basket of only missing products |
| TC-BUG-7-05 | A basket whose products all exist is shown unchanged | happy | e2e | Regression |

## Out of scope

- Removing the `test.fixme` marker and the row in `testing/flows/`: repository housekeeping, not behavior (neither exists in this repository).
- Unit tests: no WebApp unit test project exists.

## Open questions

- Whether the orphan line is removed from the stored Redis basket or only hidden ("drops (or flags)", "optionally remove"). No case asserts persistence; the current code removes it on the next basket write.
- Whether checkout with a mixed basket should include or reject the missing line is not stated; not covered.
- Whether the missing line should be visibly flagged to the user is left open ("drops (or flags)"); cases assert only that it is not shown.
