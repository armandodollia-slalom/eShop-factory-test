---
id: TC-BUG-42-01
type: happy
layer: e2e
covers: ["Expected: Date in the browser's time zone, 11/16/2026 09:08:50 in America/Chicago", "Actual: step 4 shows 15:08:50"]
priority: P1
---

# TC-BUG-42-01: In America/Chicago an order placed at 15:08:50 UTC shows 11/16/2026 09:08:50

## Why

- The ticket's first Expected bullet is the core of the bug: a Chicago shopper must see 09:08:50, not the UTC 15:08:50. Seeding a fixed OrderDate makes the expected text exact; e2e is the only layer where the browser's time zone applies.

## Preconditions

- Test stack running with scenario `bug-42` (see `_index.md`): alice's order #1 has OrderDate `2026-11-16T15:08:50Z`.
- Playwright browser context created with `timezoneId: 'America/Chicago'`.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Navigate to `/user/orders`.
3. Read the text of the Date cell (`.order-date`) in the row whose `.order-number` is `1`.

## Expected result

- The Date cell text (trimmed) is exactly `11/16/2026 09:08:50`.
- The Date cell text is not `11/16/2026 15:08:50`.
