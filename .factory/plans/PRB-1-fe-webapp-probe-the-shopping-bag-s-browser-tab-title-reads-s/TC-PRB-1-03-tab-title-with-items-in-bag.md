---
id: TC-PRB-1-03
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: tab title is \"Shopping bag | AdventureWorks\"", "Expected: Nothing else on the page changes", "Steps to Reproduce 1-2 (bag with items)"]
priority: P2
---

# TC-PRB-1-03: Tab title reads "Shopping bag | AdventureWorks" when the bag holds an item

## Why

- The story's Expected title applies to the `/cart` page as a whole, but the page has two renderings: the empty-bag block (checked by TC-PRB-1-01) and the item list. This case covers the other side of that boundary, so a fix that only sets the title in the empty branch, or a regression that changes the heading when items are present, is caught. It runs at e2e because the title and heading exist only in the browser, and it uses `bob` so alice's basket stays empty for TC-PRB-1-01 and TC-PRB-1-02.

## Preconditions

- The test stack is running with scenario `default`.
- Seeded user `bob` (password `Pass123$`) exists and his basket is empty.
- Catalog item 99 "Adventurer GPS Watch" exists (scenario `default`).

## Steps

1. Open the WebApp root `/`, follow the sign-in link and sign in on the Identity login page with Username `bob` and Password `Pass123$`.
2. Navigate to `/item/99` and click the button `Add to shopping bag`.
3. Navigate to `/cart`.
4. Read the page title (`page.title()`) and the page header `h1`.

## Expected result

- The browser is on path `/cart`.
- The page lists exactly one `.cart-item`, whose `.name` text is `Adventurer GPS Watch`, and the page has no `.cart-empty` element.
- The page title is exactly `Shopping bag | AdventureWorks` (case-sensitive string equality).
- The page header `h1` text is exactly `Shopping bag`.
