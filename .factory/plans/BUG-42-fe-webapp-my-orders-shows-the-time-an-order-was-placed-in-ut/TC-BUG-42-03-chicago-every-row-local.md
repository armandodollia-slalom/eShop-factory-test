---
id: TC-BUG-42-03
type: happy
layer: e2e
covers: ["Expected: every other order on the page is shown the same way", "Expected: same format as today (MM/dd/yyyy HH:mm:ss)"]
priority: P1
---

# TC-BUG-42-03: In America/Chicago every order on the page shows its local date and time, across DST and a previous-day rollover

## Why

- The third Expected bullet says every order is converted, not only the newest; a fix that touched only the first row or applied one fixed offset would pass TC-01 but fail here. Order 2 is in daylight time (UTC-5) and order 3 rolls back to the previous day, so a hard-coded -6 offset or a time-only shift shows wrong values. Order 2's 16:05:07 also checks the 24-hour, zero-padded format.

## Preconditions

- Test stack running with scenario `bug-42`: alice has orders #1 to #5 with the OrderDates in `_index.md`.
- Playwright browser context created with `timezoneId: 'America/Chicago'`.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Navigate to `/user/orders`.
3. For each order row (`li.orders-item` with an `.order-number`), read the `.order-number` and `.order-date` text.

## Expected result

- Exactly 5 order rows are shown.
- The Date text per order number (trimmed) is:
  - `1` → `11/16/2026 09:08:50`
  - `2` → `07/04/2026 16:05:07`
  - `3` → `03/01/2026 23:59:59`
  - `4` → `11/16/2026 08:59:59`
  - `5` → `11/16/2026 09:00:00`
- Every Date text matches `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$` (no AM/PM, no time zone suffix).
