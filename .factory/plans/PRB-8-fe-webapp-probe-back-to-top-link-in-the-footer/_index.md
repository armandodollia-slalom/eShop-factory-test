---
story: PRB-8
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/181"
story-sha: 0c8336cc71eb
plan-sha: b367eee28a34
verified-score: 9
verified-at: "2026-11-16T14:15:57.078Z"
verified-by: test-planner@d8121b51/67b01306
automation-sha: 098129f98762
automation-plan-sha: b367eee28a34
automation-score: 10
automation-verified-at: "2026-11-16T14:23:52.747Z"
---
# Test plan: PRB-8 "Back to top" link in the footer

Scope: the WebApp footer's new "Back to top" link. Every case runs at the `e2e` layer (Playwright on the test stack, scenario `default`, anonymous shopper) because the requirements are rendered markup and browser scroll behaviour, which no unit or functional host can observe. The cases cover where the link appears (AC1), what clicking it does on the catalog page (AC2) and that the rest of the footer did not change (AC3).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-PRB-8-01 | Catalog page footer shows "Back to top" as the last legal link | happy | e2e | AC1 |
| TC-PRB-8-02 | Item page footer shows "Back to top" next to the legal links | happy | e2e | AC1 ("any page") |
| TC-PRB-8-03 | Clicking "Back to top" at the bottom of the catalog scrolls to the top and shows the header on the same page | happy | e2e | AC2 |
| TC-PRB-8-04 | "Back to top" on catalog page 2 keeps the shopper on page 2 instead of the home page | sad | e2e | AC2 ("without leaving the page"), base-href boundary |
| TC-PRB-8-05 | Footer link columns, brand and social links are unchanged | happy | e2e | AC3 (other links) |
| TC-PRB-8-06 | Copyright line and Privacy, Terms, Cookies legal links are unchanged | happy | e2e | AC3 (copyright, legal links) |

## Out of scope

- Visual styling of the link (the story adds no CSS; the PR check's design critic covers the look).
- Unit and functional tests: the change is Razor markup in the WebApp with no API or service behaviour.

## Open questions

- AC2 only names the catalog page. Clicking "Back to top" on other pages (item page, cart, orders, checkout) is not given an expected outcome, so it is not planned as a case; TC-PRB-8-02 only checks the link's presence there.
- Keyboard activation (Enter on the focused link) and screen-reader announcements are not described by the story.
- Whether `#top` should remain in the address bar after the click is not stated; cases assert the path and query only.
