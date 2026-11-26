---
id: TC-BUG-7-05
type: happy
layer: e2e
covers: ["Regression: valid lines still shown"]
priority: P2
---

# TC-BUG-7-05: A basket whose products all exist is shown unchanged

## Why

- Guards that the fix (skipping lines absent from the catalog) does not drop valid lines. Uses its own user (`bob`) so it does not alter `alice`'s empty-basket control in TC-BUG-7-04.

## Preconditions

- Test stack running; scenario `bug-7` (new, `extends: default`) loaded. It adds the users and Redis baskets named in this case (each case uses its own user, so the seeded baskets do not overlap).
- User `bob` (password `Pass123$`), Redis basket: product 99 x1 and product 1 x3 (both in the default catalog).

## Steps

1. Sign in as `bob` / `Pass123$`.
2. Open `http://localhost:18080/cart`.

## Expected result

- Two cart rows: product 99 quantity 1 and product 1 quantity 3, in basket order.
- Header `.cart-button-count` shows 4.
