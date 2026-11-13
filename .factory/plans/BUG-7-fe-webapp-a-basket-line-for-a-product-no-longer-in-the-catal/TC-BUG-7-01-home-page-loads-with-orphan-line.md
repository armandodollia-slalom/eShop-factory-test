---
id: TC-BUG-7-01
type: sad
sad-path: not-found
layer: e2e
covers: ["Expected: The site works", "Expected: cart drops (or flags) the missing product", "Steps 1-2: sign in as oscar and open /"]
priority: P1
---

# TC-BUG-7-01: A page renders and the cart menu ignores a basket line for a product missing from the catalog

## Why

- This is the reported bug: the cart menu renders on every page and indexed a missing product, so the whole site failed. Also asserts the cart menu drops the missing line (no count). E2E on the test stack because the failure is the Blazor render, not an API contract.

## Preconditions

- Test stack running; scenario `basket-edge` (new, `extends: default`) loaded. It adds the users and Redis baskets named in this case (each case uses its own user, so the seeded baskets do not overlap).
- User `oscar` (password `Pass123$`), Redis basket: only product 99999 x1 (not in the 101-item catalog).

## Steps

1. Open `http://localhost:18080/` and sign in as `oscar` / `Pass123$`.
2. After redirect back, wait for the catalog list to render.
3. Locate the cart link in the header (`a[href="cart"]`).

## Expected result

- The home page renders the catalog items and the header; no error page and no "An unhandled error" banner.
- The page does not stay in a failed render state: the user can click a catalog item and its item page also renders.
- The Blazor error UI (`#blazor-error-ui`) is not visible.
- The cart link in the header is the plain `icon-button` (aria-label "Shopping bag") with no `.cart-button-count` element, i.e. the line for 99999 contributes no count.
- No text containing "99999" appears in the header.
