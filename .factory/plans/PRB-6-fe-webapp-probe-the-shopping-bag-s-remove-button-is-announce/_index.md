---
story: PRB-6
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/168"
story-sha: 544d32268534
plan-sha: 590d78339b8f
verified-score: 10
verified-at: "2026-11-15T19:15:17.797Z"
verified-by: test-planner@d8121b51/67b01306
automation-sha: c87d26f7392c
automation-plan-sha: 590d78339b8f
automation-score: 10
automation-verified-at: "2026-11-15T19:32:33.257Z"
---
# Test plan: PRB-6 [FE - WebApp] - [PROBE] The shopping bag's remove button is announced as "Remove … from your bag"

Scope: the accessible name of each line's remove button on the shopping bag page (`/cart`) of the WebApp. The story's contract is that the name reads `Remove {product} from your shopping bag`, while the button's visible text ("Remove") and its behaviour (removing the line from the bag) stay as they were. The change is in Razor markup that only renders in the browser, so every case runs on the `e2e` layer against the test stack, signed in as the seeded user `alice` (`Pass123$`) on the `default` scenario (empty basket, demo catalog where item 1 is "Wanderer Black Hiking Boots" and item 2 is "Summit Pro Harness").

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-PRB-6-01 | Remove button is named "Remove Wanderer Black Hiking Boots from your shopping bag" | happy | e2e | Expected (accessible name), Steps to Reproduce 1-3, Acceptance Criteria |
| TC-PRB-6-02 | Remove button's visible text is still "Remove" | happy | e2e | Expected (visible text unchanged) |
| TC-PRB-6-03 | Activating the remove button still removes the line from the shopping bag | happy | e2e | Expected (what it does unchanged) |
| TC-PRB-6-04 | Each line's remove button names its own product with "from your shopping bag" | happy | e2e | Bug Report (each line's remove button) |
| TC-PRB-6-05 | The remove button named for one product does not remove the other line | sad (boundary) | e2e | Expected (what it does unchanged), Bug Report (each line's remove button) |

## Out of scope

- Other controls on the line (quantity stepper, decrease/increase buttons and their accessible names): the story does not change them.
- The page heading, header bag button and footer wording: the story cites them only as the reference term "shopping bag".
- Anonymous access to `/cart`, back-end Basket API behaviour: unchanged by this bug and not described by the story.

## Open questions

- None. The story states the exact expected accessible name; whether the old wording "from your bag" may appear anywhere else on the page is not asked, so the cases only assert the remove button's own name.
