---
id: TC-BUG-42-04
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: the date follows the browser's time zone too"]
priority: P2
---

# TC-BUG-42-04: In Asia/Tokyo orders one second either side of local midnight show different dates

## Why

- The date-follows-zone rule has a boundary at local midnight: 14:59:59 UTC is still 16 November in Tokyo and 15:00:00 UTC is 17 November. An off-by-one in the offset or a conversion that rounds or drops seconds would put both on the same day. Same layer and scenario as TC-02 because only the browser applies the zone.

## Preconditions

- Test stack running with scenario `bug-42`: alice's order #4 has OrderDate `2026-11-16T14:59:59Z` and order #5 has `2026-11-16T15:00:00Z`.
- Playwright browser context created with `timezoneId: 'Asia/Tokyo'`.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Navigate to `/user/orders`.
3. Read the `.order-date` text of the rows whose `.order-number` is `4` and `5`.

## Expected result

- Order `4` shows exactly `11/16/2026 23:59:59`.
- Order `5` shows exactly `11/17/2026 00:00:00`.
