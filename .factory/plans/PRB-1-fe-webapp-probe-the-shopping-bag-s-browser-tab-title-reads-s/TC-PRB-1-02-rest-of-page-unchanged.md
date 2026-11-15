---
id: TC-PRB-1-02
type: happy
layer: e2e
covers: ["Expected: Nothing else on the page changes", "Bug Report: page heading and footer link say \"Shopping bag\""]
priority: P2
---

# TC-PRB-1-02: The rest of the shopping bag page is unchanged

## Why

- The story's Expected result limits the fix to the tab title: "Nothing else on the page changes". This case guards against a fix that also alters the visible heading, the empty-bag content or the footer link the bug report cites as the reference wording. It is separate from TC-PRB-1-01 because it checks different observable elements, and it runs at e2e because these are rendered in the browser on the same page.

## Preconditions

- The test stack is running with scenario `default`.
- Seeded user `alice` (password `Pass123$`) exists and her basket is empty.

## Steps

1. Open the WebApp root `/`, follow the sign-in link and sign in on the Identity login page with Username `alice` and Password `Pass123$`.
2. Navigate to `/cart`.
3. Read the page header `h1`, the `.cart-empty` block and the footer link with `href="cart"`.

## Expected result

- The page header `h1` text is exactly `Shopping bag`.
- The `.cart-empty` block contains an `h2` with text `Your shopping bag is empty` and a link `Start shopping` with `href="/"`.
- The footer contains a link with `href="cart"` whose text is exactly `Shopping bag`.
