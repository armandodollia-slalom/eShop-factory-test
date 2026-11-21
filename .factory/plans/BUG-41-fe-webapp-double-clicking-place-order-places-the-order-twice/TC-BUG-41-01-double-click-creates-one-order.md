---
id: TC-BUG-41-01
type: sad
sad-path: concurrency
layer: e2e
covers: ["Steps to Reproduce 1-4", "Expected: a double-click places exactly one order with the bag's total", "Acceptance Criteria"]
priority: P1
---

# TC-BUG-41-01: Double-clicking Place order creates exactly one order with the bag's total

## Why

- This is the reported bug: two submits of the checkout form created two identical orders and charged the shopper twice. Only a real browser double-click exercises the submit-once script and the shared `x-requestid` together, so the case runs e2e on the test stack exactly as the ticket's reproduction steps.

## Preconditions

- Test stack running with scenario `default`: user `alice` (password `Pass123$`) has an empty shopping bag and no orders.
- Catalog item 28 "Alpine Peak Down Jacket" exists with price 249.99.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Open the product page of "Alpine Peak Down Jacket" (item 28) and click **Add to shopping bag**.
3. Open the shopping bag, then click **Check out** to open `/checkout` (address fields are prefilled from alice's profile: `15703 NE 61st Ct`, `Redmond`, `WA`, `98052`, `U.S.`).
4. Double-click the **Place order** button (`dblclick` on the button with text "Place order").
5. Wait until the browser has navigated away from `/checkout`, then open My orders (`/user/orders`).

## Expected result

- My orders lists exactly one order (alice had none before).
- That order's total is `$249.99`.
- That order's date is today's date.
- Reloading `/user/orders` still lists exactly one order (no second order arrives late).
