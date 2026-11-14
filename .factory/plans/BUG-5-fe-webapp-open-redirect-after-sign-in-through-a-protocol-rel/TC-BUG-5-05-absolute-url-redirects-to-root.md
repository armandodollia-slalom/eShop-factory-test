---
id: TC-BUG-5-05
type: sad
sad-path: validation
layer: e2e
covers: ["Code map: https://host -> /"]
priority: P1
---

# TC-BUG-5-05: Absolute returnUrl https://evil.example/ does not leave the site

## Why

- Absolute off-site URLs are the plain open-redirect form and must still be rejected after the helper rewrite.

## Preconditions

- Test stack running (`factory teststack up`) with scenario `default`; WebApp at http://localhost:18080.
- User alice (password `Pass123$`) exists; browser is signed out.

## Steps

1. Open `http://localhost:18080/user/login?returnUrl=https%3A%2F%2Fevil.example%2F`.
2. Sign in as `alice` / `Pass123$`.

## Expected result

- After sign-in the browser URL is `http://localhost:18080/`.
- No request is made to host `evil.example`.
