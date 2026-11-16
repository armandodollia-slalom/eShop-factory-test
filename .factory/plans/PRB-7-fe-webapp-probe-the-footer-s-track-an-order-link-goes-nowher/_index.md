---
story: PRB-7
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/180"
story-sha: c86874d1a74a
plan-sha: d3bb95b69309
verified-score: 10
verified-at: "2026-11-16T14:12:36.225Z"
verified-by: test-planner@d8121b51/67b01306
automation-sha: 2c029dfc034f
automation-plan-sha: d3bb95b69309
automation-score: 10
automation-verified-at: "2026-11-16T14:26:36.019Z"
---
# Test plan: PRB-7 [FE - WebApp] - [PROBE] The footer's "Track an order" link goes nowhere

Scope: the site footer's **Support** → "Track an order" link in the WebApp. As signed-in `alice` on the test stack, clicking it must open the My orders page (`/user/orders`), the same destination as the footer's **Shop** → "My orders" link, while the link text, its position in the Support column and every other footer link stay unchanged. Everything is browser-visible, so all cases run on the `e2e` layer (Playwright on the test stack, scenario `default`).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-PRB-7-01 | Signed-in shopper clicking footer "Track an order" lands on My orders | happy | e2e | Steps to Reproduce 1-3; Expected: opens /user/orders; Acceptance Criteria |
| TC-PRB-7-02 | "Track an order" and "My orders" footer links resolve to the same destination | happy | e2e | Expected: same page as the footer's "My orders" link |
| TC-PRB-7-03 | "Track an order" keeps its text and third place in the Support column | happy | e2e | Expected: link text and place in the footer unchanged |
| TC-PRB-7-04 | Every other footer link is unchanged | happy | e2e | Expected: every other footer link unchanged |
| TC-PRB-7-05 | Anonymous click on "Track an order" is sent to sign-in, exactly like "My orders", and shows no orders | sad | e2e | Expected: same page as "My orders"; Bug Report: signed-in shopper's orders |

## Out of scope

- Content of the My orders page itself (order list, empty state): unchanged by this bug and not part of the Expected result.
- Other footer links gaining destinations (Help center, Size guide, …): the story requires them to stay as they are (checked by TC-PRB-7-04).

## Open questions

- Anonymous shopper: the story only describes a signed-in shopper and does not name the anonymous outcome. TC-PRB-7-05 therefore asserts only what "the same page as the footer's My orders link" implies: the anonymous click lands where "My orders" lands (the sign-in challenge) and shows no orders. The exact sign-in URL and its return URL are not asserted.
