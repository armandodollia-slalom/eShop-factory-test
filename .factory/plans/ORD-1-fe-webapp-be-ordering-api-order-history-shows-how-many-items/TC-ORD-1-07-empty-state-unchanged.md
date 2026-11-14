---
id: TC-ORD-1-07
type: happy
layer: e2e
covers: ["Behavior: empty state unchanged", "AC6"]
priority: P2
---

# TC-ORD-1-07: User with no orders sees the existing empty state

## Why

- AC6: the page was edited around the list; the empty branch must still render. Needs a user with no orders while other users have orders, so carol is added to the scenario.

## Preconditions

- Scenario `ord-1` loaded; test stack up.
- Signed in as carol (`Pass123$`), who has no orders.

## Steps

1. Open `/user/orders`.

## Expected result

- The page shows the heading `No orders yet` in the `.orders-empty` block.
- No `.orders-list` element and no `Items` header are present.
