---
id: TC-BUG-42-05
type: happy
layer: e2e
covers: ["Expected: the order number, total and status are unchanged"]
priority: P2
---

# TC-BUG-42-05: Order number, total and status are unchanged by the date conversion

## Why

- The ticket requires the other columns to stay as they are; the fix rewrites text inside the rows on the client, so a selector that is too broad could rewrite or blank another cell. Run in Asia/Tokyo, where every date changes, so any spill-over into other cells is visible.

## Preconditions

- Test stack running with scenario `bug-42`: alice's orders #1 to #5 with the statuses and items in `_index.md`.
- Playwright browser context created with `timezoneId: 'Asia/Tokyo'`.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Navigate to `/user/orders`.
3. For each order row, read the `.order-number`, `.order-total` and `.order-status` text (trimmed).

## Expected result

- The header row still reads `Number`, `Date`, `Total`, `Status`.
- Rows (number → total, status):
  - `1` → `$149.99`, `Submitted`
  - `2` → `$399.98`, `Paid`
  - `3` → `$349.98`, `Shipped`
  - `4` → `$199.99`, `Cancelled`
  - `5` → `$149.99`, `Submitted`
- Each row's `.order-date` cell still contains the Tokyo Date listed in `_index.md` (`1` → `11/17/2026 00:08:50`), and no date text appears in any number, total or status cell.
