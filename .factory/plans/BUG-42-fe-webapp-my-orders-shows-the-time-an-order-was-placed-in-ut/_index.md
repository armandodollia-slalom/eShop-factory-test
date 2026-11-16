---
story: BUG-42
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/193"
story-sha: 2e973e632108
plan-sha: f5529c737ead
verified-score: 9
verified-at: "2026-11-16T18:00:31.466Z"
verified-by: test-planner@d8121b51/67b01306
automation-sha: 556f7a4577c3
automation-plan-sha: f5529c737ead
automation-score: 10
automation-verified-at: "2026-11-16T19:19:40.114Z"
---
# Test plan: BUG-42 [FE - WebApp] - My orders shows the time an order was placed in UTC, not the shopper's own time

Scope: the **Date** column of My orders (`/user/orders`) in the WebApp. Each order's Date must be the instant the order was placed, shown in the browser's own time zone in the existing `MM/dd/yyyy HH:mm:ss` format (24-hour, zero-padded), for every order on the page, with the order number, total and status unchanged. All cases are `e2e` (Playwright in `e2e/teststack/`) because the conversion happens in the browser; each case sets the browser context's `timezoneId` (`America/Chicago`, `Asia/Tokyo`) and signs in as `alice` / `Pass123$`.

Cases TC-BUG-42-01 to 05 use a new scenario `bug-42` (`extends: default`) that seeds alice's orders in `orderingdb` at fixed UTC instants, so every expected Date is exact. TC-BUG-42-06 replays the bug report's steps with an order placed through the UI on the `default` scenario.

Seeded orders of scenario `bug-42` (buyer = alice, IdentityGuid `50ddac7e-9b69-4d68-a91b-25100ef2e403`; order items carry the unit prices below):

| Order # | OrderDate (UTC) | Status | Items | Total shown | Chicago Date | Tokyo Date |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 2026-11-16T15:08:50Z | Submitted | 1 × Explorer 45L Backpack @ 149.99 | $149.99 | 11/16/2026 09:08:50 | 11/17/2026 00:08:50 |
| 2 | 2026-07-04T21:05:07Z | Paid | 2 × Adventurer GPS Watch @ 199.99 | $399.98 | 07/04/2026 16:05:07 | 07/05/2026 06:05:07 |
| 3 | 2026-03-02T05:59:59Z | Shipped | 1 × Explorer 45L Backpack @ 149.99, 1 × Adventurer GPS Watch @ 199.99 | $349.98 | 03/01/2026 23:59:59 | 03/02/2026 14:59:59 |
| 4 | 2026-11-16T14:59:59Z | Cancelled | 1 × Adventurer GPS Watch @ 199.99 | $199.99 | 11/16/2026 08:59:59 | 11/16/2026 23:59:59 |
| 5 | 2026-11-16T15:00:00Z | Submitted | 1 × Explorer 45L Backpack @ 149.99 | $149.99 | 11/16/2026 09:00:00 | 11/17/2026 00:00:00 |

Order 2 falls in US daylight time (CDT, UTC-5); the others in standard time (CST, UTC-6). Tokyo is UTC+9 all year. Rows are located by order number, not by position, because the page does not define an order for its rows.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-42-01 | In America/Chicago an order placed at 15:08:50 UTC shows 11/16/2026 09:08:50 | happy | e2e | Expected bullet 1; Actual step 4 |
| TC-BUG-42-02 | In Asia/Tokyo the same order shows the next day, 11/17/2026 00:08:50 | happy | e2e | Expected bullet 2; Actual step 5 |
| TC-BUG-42-03 | In America/Chicago every order on the page shows its local date and time, across DST and a previous-day rollover | happy | e2e | Expected bullet 3 (every other order); Expected bullet 1 (format) |
| TC-BUG-42-04 | In Asia/Tokyo orders one second either side of local midnight show different dates | sad | e2e | Expected bullet 2 (date follows time zone) |
| TC-BUG-42-05 | Order number, total and status are unchanged by the date conversion | happy | e2e | Expected bullet 3 (number, total, status unchanged) |
| TC-BUG-42-06 | Bug report replay: an order placed through the UI in America/Chicago shows the browser clock's time on My orders | happy | e2e | Steps to Reproduce 1-4; Acceptance criterion |

## Out of scope

- Ordering.API's order list contract (`GET /api/orders`): the story does not change it; the conversion is in the browser.
- The UTC fallback text when JavaScript is off: an implementation decision in the notes, not an acceptance criterion.
- Other pages that show dates (order detail, admin pages): the bug is about My orders only.
- Empty and loading states of My orders: they show no dates and the story does not change them.

## Open questions

- Whether the Date must stay local after the page refreshes itself on an order status change (`OrdersRefreshOnStatusChange`): the ticket says every order on the page is shown in local time, but whether a status change happens within a test's timeframe on the test stack depends on the ordering background services; no case asserts on a status-change refresh.
- Time zones with non-whole-hour offsets (for example Asia/Kolkata, UTC+5:30) are not named by the story; the cases use the two zones it names.
