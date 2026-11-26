---
id: TC-ORDST-1-09
type: happy
layer: e2e
covers: ["AC1: Status filter above the list", "AC1: options in order", "AC1: All selected when the page opens"]
priority: P1
---

# TC-ORDST-1-09: My orders shows a "Status" filter with All and the six names in order, All selected

## Why

- AC1 fixes the filter's label, its seven options and their order, and the initial selection. Only the rendered WebApp shows these, so e2e; alice has orders, which AC1 requires for the filter to appear.

## Preconditions

- Test stack running with scenario `ordst-1`.
- Signed in to the WebApp as `alice` / `Pass123$`.

## Steps

1. Open `/user/orders`.

## Expected result

- A filter labelled `Status` is visible and sits above the orders list (its bounding box's top is above the list's header row).
- Its options, in DOM order, have exactly the texts `All`, `Submitted`, `AwaitingValidation`, `StockConfirmed`, `Paid`, `Shipped`, `Cancelled`.
- `All` is the selected option (`aria-current="true"`); no other option is marked selected.
- The list shows all four orders 101, 102, 103, 104.
