---
id: TC-BUG-44-05
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: no order is placed", "Algorithm: HandleSubmitAsync submits only when validation passes"]
priority: P1
---

# TC-BUG-44-05: Submitting with every address field empty places no order

## Why

- The story keeps "no order is placed" for empty fields; adding display names must not change whether validation blocks submission. A separate case because it asserts persisted state (no order, basket kept), not message text. e2e because the order flow runs through the WebApp, Basket and Ordering on the test stack.

## Preconditions

- Test stack running with scenario `default`; user `bob` has an empty basket and no orders.

## Steps

1. Sign in as `bob`.
2. Add "Explorer 45L Backpack" to the shopping bag.
3. Navigate to `/checkout`.
4. Clear the Address, City, State, Zip code and Country inputs.
5. Click **Place order**.
6. Navigate to `/user/orders`.
7. Navigate to `/cart`.

## Expected result

- After step 5 the browser is still on `/checkout`.
- At step 6 the orders page shows the "No orders yet" empty state and no order rows.
- At step 7 the shopping bag still contains "Explorer 45L Backpack" with quantity 1.
