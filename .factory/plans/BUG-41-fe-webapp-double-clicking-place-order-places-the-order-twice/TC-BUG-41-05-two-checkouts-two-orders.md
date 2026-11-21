---
id: TC-BUG-41-05
type: happy
layer: e2e
covers: ["Expected: a single click places one order, exactly as today (each new checkout gets its own order)"]
priority: P1
---

# TC-BUG-41-05: Two separate checkouts, one click each, create two orders

## Why

- The fix makes every post of one rendered checkout form share one request id, and Ordering now treats a repeated id as a duplicate. If the id were reused across separate visits to the checkout page, a shopper's second, legitimate order would silently be dropped. Today two checkouts create two orders, and the story requires single clicks to behave as today; only the WebApp renders new forms, so it is e2e.

## Preconditions

- Test stack running with scenario `default`: user `alice` has an empty shopping bag and no orders.

## Steps

1. Sign in to the WebApp as `alice` / `Pass123$`.
2. Add "Alpine Peak Down Jacket" (item 28) to the shopping bag, open the bag, click **Check out**, click **Place order** once and wait for `/user/orders`.
3. Add "Alpine Peak Down Jacket" (item 28) to the shopping bag again, open the bag, click **Check out** (a newly loaded `/checkout` page), click **Place order** once and wait for `/user/orders`.

## Expected result

- After step 2, My orders lists exactly one order with total `$249.99`.
- After step 3, My orders lists exactly two orders, each with total `$249.99`.
- The shopping bag is empty after step 3.
