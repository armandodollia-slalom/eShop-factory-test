---
id: TC-BUG-5-04
type: sad
sad-path: validation
layer: e2e
covers: ["Suggested fix: not followed by / or \\"]
priority: P1
---

# TC-BUG-5-04: returnUrl /\evil.example (slash then backslash) does not leave the site

## Why

- Browsers treat `/\host` like `//host`; this variant bypasses a naive leading-double-slash check, so it is checked in the browser.

## Preconditions

- Test stack running (`factory teststack up`) with scenario `default`; WebApp at http://localhost:18080.
- User alice (password `Pass123$`) exists; browser is signed out.

## Steps

1. Open `http://localhost:18080/user/login?returnUrl=%2F%5Cevil.example`.
2. Sign in as `alice` / `Pass123$`.

## Expected result

- After sign-in the browser URL is `http://localhost:18080/`.
- No request is made to host `evil.example`.
