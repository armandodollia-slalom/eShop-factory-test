---
story: PRB-2
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/157"
story-sha: 27b6810f10ba
plan-sha: f7e37b179644
verified-score: 10
verified-at: "2026-11-15T18:08:02.361Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: 692a14ee5cdc
automation-plan-sha: f7e37b179644
automation-score: 10
automation-verified-at: "2026-11-15T18:13:17.486Z"
---
# Test plan: PRB-2 The orders page is titled "Orders" while every link to it says "My orders"

Text-only bug fix in the WebApp: the orders page (`/user/orders`) must show the heading "My orders" and the browser tab title "My orders | AdventureWorks", matching the "My orders" links in the user menu and footer, while the rest of the page (empty state and order list) is unchanged. All cases run as Playwright e2e specs on the test stack, signed in as the seeded user `alice` except the anonymous-access case TC-PRB-2-06, because the heading and document title only exist in the rendered WebApp.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-PRB-2-01 | Opening "My orders" from the user menu shows the page heading "My orders" | happy | e2e | Expected heading; Steps 1-3; Acceptance Criteria |
| TC-PRB-2-02 | The orders page's browser tab title is "My orders \| AdventureWorks" | happy | e2e | Expected tab title; Step 3; Acceptance Criteria |
| TC-PRB-2-03 | The footer link "My orders" opens a page headed "My orders" | happy | e2e | Bug Report: footer link |
| TC-PRB-2-04 | With no orders, the page body still shows the "No orders yet" empty state | happy | e2e | Expected: everything else unchanged |
| TC-PRB-2-05 | With one order, the orders list still shows its header row and the order under the "My orders" heading | happy | e2e | Expected: list of orders unchanged |
| TC-PRB-2-06 | An anonymous visitor opening /user/orders is sent to the Login page and does not see the "My orders" page | sad | e2e | Expected: everything else unchanged (sign-in requirement) |

## Out of scope

- Unit and functional layers: no API, domain or service behaviour changes.
- Headings and titles of other pages (Catalog, Cart, Checkout, Item).

## Open questions

- The ticket defines no error behaviour of its own. Its only sad path is the one implied by "everything else on the page is unchanged": the page keeps requiring sign-in (TC-PRB-2-06). Whether the visitor returns to `/user/orders` after signing in is not stated, so no case asserts it.
