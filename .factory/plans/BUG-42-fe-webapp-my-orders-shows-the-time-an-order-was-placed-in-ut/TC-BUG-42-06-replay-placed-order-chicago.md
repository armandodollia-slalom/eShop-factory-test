---
id: TC-BUG-42-06
type: happy
layer: e2e
covers: ["Steps to Reproduce 1-4", "Acceptance criteria: repeating the steps matches Expected", "Expected: Date is the date and time the order was placed in the browser's time zone"]
priority: P1
---

# TC-BUG-42-06: Bug report replay: an order placed through the UI in America/Chicago shows the browser clock's time on My orders

## Why

- The acceptance criterion is to repeat the reported steps: an order placed now, through checkout, then My orders opened from the site's navigation. This catches what the seeded cases cannot: the real OrderDate written by Ordering.API and the page reached by Blazor enhanced navigation rather than a full load. The exact second is not controllable, so the check is a time window from the browser clock.

## Preconditions

- Test stack running with scenario `default` (alice has no orders, empty basket).
- Playwright browser context created with `timezoneId: 'America/Chicago'`.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Open the product page of "Explorer 45L Backpack" (catalog item 7) and click **Add to shopping bag**.
3. Open the checkout page (`/checkout`), keep the prefilled address, and record `before` = the current time.
4. Click **Place order** and wait until the browser leaves the checkout page; record `after` = the current time.
5. Open My orders through the user menu's **My orders** link (no full page load).
6. Read the `.order-date` text of the only order row.

## Expected result

- Exactly one order row is shown.
- Its Date text matches `^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$`.
- Parsed as a date-time in America/Chicago, it lies between `before` truncated to the second and `after` (inclusive).
- It differs from the same instant formatted in UTC (`MM/dd/yyyy HH:mm:ss`), i.e. the page does not show the UTC time.
