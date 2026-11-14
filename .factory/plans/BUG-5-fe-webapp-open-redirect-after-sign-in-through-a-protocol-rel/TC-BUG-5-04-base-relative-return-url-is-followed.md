---
id: TC-BUG-5-04
type: happy
layer: e2e
covers: ["Decisions: base-relative URLs without leading slash stay allowed","LogIn.Url(nav)"]
priority: P1
---

# TC-BUG-5-04: A base-relative returnUrl `item/5` (as produced by LogIn.Url) returns the user to the item page

## Why

- LogIn.Url(nav) emits values with no leading slash; breaking them would break the item and user-menu sign-in links, so an e2e case covers the real link.

## Preconditions

- Test stack running with scenario `default`; user alice (`Pass123$`), not signed in.

## Steps

1. Open `<webapp>/user/login?returnUrl=item%2F5`.
2. Sign in as alice with `Pass123$`.

## Expected result

- Final page URL is `<webapp>/item/5`.
