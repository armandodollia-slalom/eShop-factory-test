---
id: TC-CANC-1-05
type: sad
sad-path: conflict
layer: unit
covers: ["AC2: it never becomes Paid afterwards", "Deviation: Order.SetPaidStatus() only moves an order from StockConfirmed"]
priority: P2
---

# TC-CANC-1-05: Setting a cancelled order to Paid leaves it Cancelled

## Why

- AC2's "never becomes Paid" rests on one domain rule (the notes say no new code was added for it). A late payment-succeeded event for a cancelled order calls `Order.SetPaidStatus()`; if that rule regressed, the shopper would be charged. A unit test pins the rule cheaply and deterministically, complementing the slower e2e case TC-CANC-1-04.

## Preconditions

- An `Order` built in memory (as in `tests/Ordering.UnitTests`) for buyer 1 with one item (ProductId 99, unit price 10.00, 1 unit), moved to StockConfirmed (`SetAwaitingValidationStatus()`, `SetStockConfirmedStatus()`), then cancelled with `SetCancelledStatus()`; its domain events cleared after the cancel.

## Steps

1. Call `order.SetPaidStatus()`.

## Expected result

- `order.OrderStatus` is `OrderStatus.Cancelled`.
- `order.DomainEvents` contains no `OrderStatusChangedToPaidDomainEvent`.
- No exception is thrown.
