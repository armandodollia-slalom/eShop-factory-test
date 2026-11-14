---
id: TC-BUG-5-03
type: happy
layer: e2e
covers: ["Expected: user lands on a page of the WebApp","Decisions: local paths stay allowed"]
priority: P1
---

# TC-BUG-5-03: A local returnUrl `/item/5` still returns the user to that page after sign-in

## Why

- Regression guard: the fix must not break legitimate return URLs; the item-page sign-in link relies on it.

## Preconditions

- Test stack running with scenario `default` (catalog item 5 exists); user alice (`Pass123$`), not signed in.

## Steps

1. Open `<webapp>/user/login?returnUrl=%2Fitem%2F5`.
2. Sign in as alice with `Pass123$`.

## Expected result

- Final page URL is `<webapp>/item/5`.
