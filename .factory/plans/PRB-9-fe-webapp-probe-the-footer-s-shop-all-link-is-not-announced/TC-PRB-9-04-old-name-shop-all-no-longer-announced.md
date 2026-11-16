---
id: TC-PRB-9-04
type: sad
sad-path: boundary
layer: e2e
covers: ["Actual: The accessible name is \"Shop all\" (must no longer hold)", "Acceptance Criteria: the result matches Expected"]
priority: P1
---

# TC-PRB-9-04: No footer Shop link is announced with the bare name "Shop all"

## Why

- The bug's **Actual** is the failure state the fix must eliminate: a link announced only as "Shop all". The boundary is the exact name: the visible text "Shop all" is still rendered, so a fix that left the accessible name equal to the visible text (for example an `aria-label` on the wrong element, or a `title` that does not override the name) would still look fixed to a sighted tester. Checking that the exact old name resolves to nothing proves the computed name moved past the visible text. Only the rendered accessibility tree shows the computed name, so e2e.

## Preconditions

- Test stack running (`factory teststack up`) with scenario `default`.
- Anonymous visitor (no sign-in).

## Steps

1. Open the WebApp home page `/`.
2. In the footer, locate the navigation landmark with accessible name "Shop" (`getByRole('navigation', { name: 'Shop' })`).
3. Inside it, count links with the exact accessible name "Shop all": `getByRole('link', { name: 'Shop all', exact: true })`.

## Expected result

- The count is 0: no link in the Shop navigation has the exact accessible name "Shop all".
- The visible text "Shop all" is still present in the Shop navigation (`getByText('Shop all', { exact: true })` count is 1), so the zero count is due to the accessible name, not to the link being missing.
