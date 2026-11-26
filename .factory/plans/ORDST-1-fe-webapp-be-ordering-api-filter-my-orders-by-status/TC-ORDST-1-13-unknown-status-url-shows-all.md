---
id: TC-ORDST-1-13
type: sad
sad-path: validation
layer: e2e
covers: ["AC3: A status that is not one of the six names shows every order with All selected"]
priority: P1
---

# TC-ORDST-1-13: Opening /user/orders?status=Delivered shows every order with "All" selected

## Why

- AC3 says an invalid page parameter degrades to the full list instead of an error; since the API answers 400 for unknown names (AC5), a page that passed the value through would show an error. E2e because only the rendered page shows the fallback.

## Preconditions

- Test stack running with scenario `ordst-1`.
- Signed in to the WebApp as `alice` / `Pass123$`.

## Steps

1. Navigate directly to `/user/orders?status=Delivered`.

## Expected result

- `All` is marked `aria-current="true"`; none of the six status options is.
- The list shows exactly 4 rows: orders 101, 102, 103 and 104.
- No error message is shown and the text "No orders yet" and "No Delivered orders." do not appear.
