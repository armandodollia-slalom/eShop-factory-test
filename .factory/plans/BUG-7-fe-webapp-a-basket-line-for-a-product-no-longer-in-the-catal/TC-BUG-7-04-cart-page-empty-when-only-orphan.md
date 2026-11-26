---
id: TC-BUG-7-04
type: sad
sad-path: not-found
layer: e2e
covers: ["Expected: the site works with a basket of only missing products"]
priority: P2
---

# TC-BUG-7-04: Cart page shows the empty-cart state when the only line is missing from the catalog

## Why

- Boundary: after skipping, the basket is empty. The empty-cart branch of the page must be reached rather than an empty table or error.

## Preconditions

- Test stack running; scenario `bug-7` (new, `extends: default`) loaded. It adds the users and Redis baskets named in this case (each case uses its own user, so the seeded baskets do not overlap).
- User `oscar` (password `Pass123$`), Redis basket: only product 99999 x1.
- `alice` keeps the default empty basket (no `bug-7` basket is seeded for her).

## Steps

1. Sign in as `oscar`.
2. Open `http://localhost:18080/cart` and record the empty-cart message.
3. Sign out, sign in as `alice` / `Pass123$`, open `http://localhost:18080/cart` and record the message.

## Expected result

- The page renders without error (`#blazor-error-ui` not visible).
- It shows the same empty-cart message as `alice`'s empty basket does (compare the text of both pages).
- No cart rows are listed.
