---
id: TC-BUG-5-05
type: happy
layer: e2e
covers: ["Expected: / when return URL is not local"]
priority: P2
---

# TC-BUG-5-05: Sign-in without a returnUrl lands on the WebApp home page

## Why

- Covers the empty-value rule end to end: without returnUrl the user goes to `/`.

## Preconditions

- Test stack running with scenario `default`; user alice (`Pass123$`), not signed in.

## Steps

1. Open `<webapp>/user/login` (no query string).
2. Sign in as alice with `Pass123$`.

## Expected result

- Final page URL has the origin of the WebApp and path `/`.
