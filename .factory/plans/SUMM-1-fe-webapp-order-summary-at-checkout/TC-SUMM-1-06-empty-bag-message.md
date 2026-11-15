---
id: TC-SUMM-1-06
type: happy
layer: e2e
covers: ["AC4: summary says \"Your shopping bag is empty\" instead of the list and totals"]
priority: P1
---

# TC-SUMM-1-06: Empty bag shows "Your shopping bag is empty" instead of list and totals

## Why

- AC4 defines the empty state: a message replaces the list and the totals. Rendering an empty list with `Items 0` / `Total $0.00` would violate it. Alice's seeded basket is empty, so no setup beyond signing in is needed.

## Preconditions

- Scenario `default`; alice's basket is empty (nothing added).
- Signed in as alice (`alice` / `Pass123$`).

## Steps

1. As alice, navigate to `/checkout`.

## Expected result

- `section.order-summary` is present with heading `Order summary`.
- `.order-summary-empty` is present with text `Your shopping bag is empty`.
- No `li.order-summary-item`, no `.order-summary-count` and no `.order-summary-total` element is present.
- The shipping address form and the **Place order** button are present.
