---
id: TC-BUG-42-02
type: happy
layer: e2e
covers: ["Expected: same order shows 11/17/2026 00:08:50 in Asia/Tokyo; the date follows the time zone", "Actual: step 5 shows 11/16/2026 15:08:50"]
priority: P1
---

# TC-BUG-42-02: In Asia/Tokyo the same order shows the next day, 11/17/2026 00:08:50

## Why

- The second Expected bullet requires the date, not only the time, to follow the browser's zone; a fix that shifted only hours, or one fixed to the server's zone, would show 11/16. Separate from TC-01 because it checks a different zone and a calendar-day change on the same order.

## Preconditions

- Test stack running with scenario `bug-42`: alice's order #1 has OrderDate `2026-11-16T15:08:50Z`.
- Playwright browser context created with `timezoneId: 'Asia/Tokyo'`.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Navigate to `/user/orders`.
3. Read the text of the `.order-date` cell in the row whose `.order-number` is `1`.

## Expected result

- The Date cell text (trimmed) is exactly `11/17/2026 00:08:50`.
- The Date cell text is not `11/16/2026 15:08:50`.
