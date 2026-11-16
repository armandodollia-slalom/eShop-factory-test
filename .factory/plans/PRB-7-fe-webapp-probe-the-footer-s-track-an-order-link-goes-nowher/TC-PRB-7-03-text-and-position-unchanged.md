---
id: TC-PRB-7-03
type: happy
layer: e2e
covers: ["Expected: the link text and its place in the footer are unchanged"]
priority: P2
---

# TC-PRB-7-03: "Track an order" keeps its text and third place in the Support column

## Why

- The Expected result explicitly forbids moving or relabelling the link while fixing it (for example merging it into "My orders" or moving it to Shop). Asserting the Support column's ordered link list on the rendered page is the only way to see what the shopper sees, hence e2e.

## Preconditions

- Test stack running with scenario `default`.
- Signed in as `alice` / `Pass123$`.

## Steps

1. Open the WebApp home page (`/`) as signed-in `alice` and scroll to the footer.
2. Collect, in order, the text of every link inside the footer navigation named "Support".

## Expected result

- The Support column has a heading "Support" and exactly these five links in this order: "Help center", "Shipping and returns", "Track an order", "Size guide", "Contact us".
- "Track an order" appears exactly once in the whole footer, and only inside the Support navigation (not in Shop or Company).
