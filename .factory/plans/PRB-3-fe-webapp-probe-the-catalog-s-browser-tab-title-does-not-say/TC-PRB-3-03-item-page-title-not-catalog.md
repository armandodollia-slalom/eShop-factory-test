---
id: TC-PRB-3-03
type: sad
sad-path: boundary
layer: e2e
covers: ["Bug Report: every WebApp page's tab title names the page", "Expected: Nothing else on the page changes"]
priority: P2
---

# TC-PRB-3-03: Leaving the catalog for an item page does not keep the "Catalog | AdventureWorks" title

## Why

- The fix sets "Catalog | AdventureWorks" on the catalog only; the Bug Report states every other page's tab title names that page. This boundary case guards against the catalog title leaking past the catalog (for example a title set in the shared layout, or a Blazor `<PageTitle>` that is not replaced on client navigation), which would make the item page say "Catalog". It runs at e2e because the title only exists in the rendered browser document, and it starts on the catalog so the navigation leaves the fixed page.

## Preconditions

- Test stack running with scenario `default` loaded (item 99 is "Adventurer GPS Watch").
- Anonymous visitor (no sign-in).

## Steps

1. Navigate the browser to the WebApp base URL `/`.
2. Wait until the heading "Ready for a new adventure?" is visible.
3. Click the link named `Adventurer GPS Watch` in the product grid.
4. Wait until the URL path is `/item/99` and the header bar `h1` has the text `Adventurer GPS Watch`.
5. Read the document title (`page.title()`).

## Expected result

- The document title equals exactly `Adventurer GPS Watch | AdventureWorks`.
- The document title is not `Catalog | AdventureWorks`.
