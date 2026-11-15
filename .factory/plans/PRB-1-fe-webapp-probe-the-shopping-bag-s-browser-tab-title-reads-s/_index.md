---
story: PRB-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/156"
story-sha: f49f6f6fc248
plan-sha: 791e825803d7
verified-score: 10
verified-at: "2026-11-15T18:02:34.848Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: 40cf6498ab73
automation-plan-sha: 791e825803d7
automation-score: 10
automation-verified-at: "2026-11-15T18:07:36.085Z"
---
# Test plan: PRB-1 [FE - WebApp] - [PROBE] The shopping bag's browser tab title reads "Shopping Bag"

Scope: the browser tab title (`document.title`) of the WebApp's shopping bag page `/cart` on the test stack, which must read exactly `Shopping bag | AdventureWorks` (lower-case "b"), and the story's guarantee that nothing else on the page changes (page heading, page content, footer link). `/cart` requires sign-in, so every case signs in as a seeded user from scenario `default` (password `Pass123$`): `alice` with her empty basket for the empty-bag rendering, and `bob` with item 99 "Adventurer GPS Watch" added for the item-list rendering.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-PRB-1-01 | Shopping bag tab title reads "Shopping bag \| AdventureWorks" | happy | e2e | Expected: tab title; Acceptance criterion; Steps to Reproduce 1-2 |
| TC-PRB-1-02 | The rest of the shopping bag page is unchanged | happy | e2e | Expected: "Nothing else on the page changes"; Bug Report: heading and footer link say "Shopping bag" |
| TC-PRB-1-03 | Tab title reads "Shopping bag \| AdventureWorks" when the bag holds an item | sad | e2e | Expected: tab title; Expected: "Nothing else on the page changes" (non-empty bag rendering) |

## Out of scope

- Unit and functional layers: the title is static Blazor markup rendered only in the browser; no API or service behaviour changes.
- The checkout page's back link: it lives on another page, the story names it only as the reference wording, and the fix does not touch it.
- Tab titles of any page other than `/cart`.

## Open questions

- The story does not say what an anonymous visitor to `/cart` sees (the page is `[Authorize]` and redirects to sign-in); no case asserts that behaviour.
