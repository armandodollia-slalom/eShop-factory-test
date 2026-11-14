---
id: TC-BUG-7-03
type: sad
sad-path: not-found
layer: e2e
covers: ["Expected: the rest of the basket is shown"]
priority: P1
---

# TC-BUG-7-03: Cart page shows the valid lines and omits the missing product

## Why

- The story requires the rest of the basket to be shown, so a mixed basket is needed; this proves skipping one line does not discard the others, including their quantities and prices.

## Preconditions

- Test stack running; scenario `bug-7` (new, `extends: default`) loaded. It adds the users and Redis baskets named in this case (each case uses its own user, so the seeded baskets do not overlap).
- User `olive` (password `Pass123$`), Redis basket (mixed): product 99999 x1 and product 99 (Adventurer GPS Watch) x2.

## Steps

1. Sign in as `olive` / `Pass123$`.
2. Open `http://localhost:18080/cart`.

## Expected result

- The page renders without error.
- Exactly one cart row is listed: "Adventurer GPS Watch", quantity 2, with its catalog unit price and a matching line total.
- No row for product 99999.
- The header `.cart-button-count` shows 2 (the missing line adds nothing).
