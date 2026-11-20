---
id: TC-ADDED-1-10
type: happy
layer: unit
covers: ["AC4: a basket stored before this change still loads; its lines show no date", "AC4: returns it with the basket", "Implementation Notes: GetBasket returns the stored value"]
priority: P1
---

# TC-ADDED-1-10: GetBasket returns a line stored without a date with no added_at

## Why

- AC4 requires old baskets to keep working; a line without a stored time must not fail the call nor get an invented date (for example 1970-01-01 or now), which the bag would then display.

## Preconditions

- Caller `buyer-1`; repository returns `[{ProductId 99, Quantity 1, AddedAt null}, {ProductId 12, Quantity 1, AddedAt 2026-11-01T09:00:00Z}]`.

## Steps

1. Call `GetBasket`.

## Expected result

- The call succeeds with two items.
- Product 99: `quantity` 1 and `added_at` not set (`AddedAt == null` on the generated message).
- Product 12: `added_at` `2026-11-01T09:00:00Z`.
