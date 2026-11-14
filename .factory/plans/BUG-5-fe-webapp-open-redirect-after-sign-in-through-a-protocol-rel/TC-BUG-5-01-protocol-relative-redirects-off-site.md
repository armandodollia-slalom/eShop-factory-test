---
id: TC-BUG-5-01
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: lands on / not local URL","Bug report steps 1"]
priority: P0
---

# TC-BUG-5-01: A protocol-relative returnUrl signs in and lands on the WebApp home page, not off-site

## Why

- This is the reported bug (302 to http://evil.example/); e2e is the only layer that proves the browser stays on the site after the real sign-in.

## Preconditions

- Test stack running with scenario `default`; WebApp reachable at `url('webapp')`.
- User alice, password `Pass123$`; not signed in.

## Steps

1. Open `<webapp>/user/login?returnUrl=//evil.example` in a fresh browser context.
2. On the Identity sign-in form enter username `alice`, password `Pass123$` and click Login.

## Expected result

- After sign-in the final page URL has the origin of the WebApp and path `/`.
- The browser never requests any URL with host `evil.example` (no navigation or request to it).
- The page shows the WebApp catalog home (the catalog item list is visible).
