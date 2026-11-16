---
id: TC-PRB-8-01
type: happy
layer: e2e
covers: ["AC1: footer bottom row shows a Back to top link next to the legal links"]
priority: P1
---

# TC-PRB-8-01: Catalog page footer shows "Back to top" as the last legal link

## Why

- AC1 requires the link in the footer's bottom row next to the legal links; the Implementation Notes put it as the last item of the `Legal` list. If it were missing or placed elsewhere, shoppers would not find it. Only a rendered page in a browser shows this, so the case is e2e.

## Preconditions

- Test stack running with scenario `default`; anonymous shopper (not signed in).

## Steps

1. Open `/` (the catalog page).
2. Locate the footer (`footer.eshop-footer`) and, in it, the list with accessible name `Legal`.

## Expected result

- The `Legal` list has exactly 4 items, in order: `Privacy`, `Terms`, `Cookies`, `Back to top`.
- The `Back to top` item contains a link (`role=link`, name `Back to top`) that is visible.
- The `Legal` list is inside the footer's bottom row (`.eshop-footer-bottom`), the same row as the copyright line.
- There is exactly one link named `Back to top` on the page.
