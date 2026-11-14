---
id: TC-BUG-5-02
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: lands on / not local URL","Technical Notes: reject /\ forms"]
priority: P1
---

# TC-BUG-5-02: A returnUrl of `/\evil.example` signs in and lands on the WebApp home page

## Why

- Browsers treat `/\host` as `//host`; the fix must reject it, so the e2e flow guards the second bypass form.

## Preconditions

- Test stack running with scenario `default`; user alice (`Pass123$`), not signed in.

## Steps

1. Open `<webapp>/user/login?returnUrl=%2F%5Cevil.example`.
2. Sign in as alice with `Pass123$`.

## Expected result

- Final page URL has the origin of the WebApp and path `/`.
- The browser never requests any URL with host `evil.example`.
