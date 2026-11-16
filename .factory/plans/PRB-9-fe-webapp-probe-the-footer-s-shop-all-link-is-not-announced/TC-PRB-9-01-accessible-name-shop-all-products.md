---
id: TC-PRB-9-01
type: happy
layer: e2e
covers: ["Expected: The link's accessible name is \"Shop all products\"", "Acceptance Criteria"]
priority: P1
---

# TC-PRB-9-01: Footer "Shop all" link's accessible name is "Shop all products"

## Why

- This is the bug itself: screen readers must announce the link as "Shop all products". The rendered accessibility tree is the only place the computed name is observable, so the case runs on the e2e layer through the WebApp. That the old name "Shop all" is gone is a separate sad case (TC-PRB-9-04).

## Preconditions

- Test stack running (`factory teststack up`) with scenario `default`.
- Anonymous visitor (no sign-in).

## Steps

1. Open the WebApp home page `/`.
2. In the footer, locate the navigation landmark with accessible name "Shop" (`getByRole('navigation', { name: 'Shop' })`).
3. Inside it, query links by accessible name: `getByRole('link', { name: 'Shop all products', exact: true })`.

## Expected result

- Exactly 1 link in the Shop navigation has the accessible name "Shop all products" (exact match).
- That link's `href` resolves to the WebApp root (`/`), i.e. it is the catalog link, not another footer link.
