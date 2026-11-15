---
id: TC-PRB-3-02
type: happy
layer: e2e
covers: ["Expected: Nothing else on the page changes"]
priority: P2
---

# TC-PRB-3-02: Catalog page content is unchanged by the title fix

## Why

- The Expected result states "Nothing else on the page changes"; the fix edits the same Razor file that renders the catalog header and product grid, so a slip there would break visible content. The checks use the seeded `default` catalog values the page showed before the fix, at the e2e layer because only the rendered page shows them.

## Preconditions

- Test stack running with scenario `default` loaded (101 catalog items; item 99 is "Adventurer GPS Watch").
- Anonymous visitor (no sign-in).

## Steps

1. Navigate the browser to the WebApp base URL `/`.
2. Wait until the heading "Ready for a new adventure?" is visible.
3. Read the header bar `h1`, the header subtitle, the `.catalog-count` text and the number of `.catalog-product` elements.

## Expected result

- The `h1` in the header bar has the text `Ready for a new adventure?`.
- The header subtitle text `Start the season with the latest in clothing and equipment.` is visible.
- The `.catalog-count` element has the text `101 products`.
- Exactly 9 `.catalog-product` elements are rendered on page 1.
- A link named `Adventurer GPS Watch` is visible in the product grid.
