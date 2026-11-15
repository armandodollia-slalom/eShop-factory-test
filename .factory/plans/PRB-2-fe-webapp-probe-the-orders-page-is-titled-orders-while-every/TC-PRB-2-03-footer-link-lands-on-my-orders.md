---
id: TC-PRB-2-03
type: happy
layer: e2e
covers: ["Bug Report: footer link \"My orders\" matches the page it opens"]
priority: P2
---

# TC-PRB-2-03: The footer link "My orders" opens a page headed "My orders"

## Why

- The bug report names two entry points, the user menu and the footer; this case proves the footer link and the destination's heading and title now agree. Separate from TC-PRB-2-01 because the footer is a different link in a different layout component (`FooterBar.razor`).

## Preconditions

- Test stack running with scenario `default`.
- Signed in to the WebApp as `alice` / `Pass123$`.
- Browser is on the catalog home page `/`.

## Steps

1. In the page footer, click the link "My orders".

## Expected result

- The URL ends with `/user/orders`.
- The page header `h1` has the exact text `My orders`.
- The page title is exactly `My orders | AdventureWorks`.
