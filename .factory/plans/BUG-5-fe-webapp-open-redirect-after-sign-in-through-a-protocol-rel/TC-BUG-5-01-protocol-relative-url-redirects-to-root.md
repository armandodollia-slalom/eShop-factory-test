---
id: TC-BUG-5-01
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: lands on a WebApp page (/)", "Technical Notes: //evil.example"]
priority: P0
---

# TC-BUG-5-01: Protocol-relative returnUrl does not leave the site after sign-in

## Why

- This is the reported bug (open redirect, phishing risk); only a browser run proves the real redirect from sign-in ends on the WebApp origin, so it is e2e.

## Preconditions

- Test stack running (`factory teststack up`) with scenario `default`; WebApp at http://localhost:18080.
- User alice (password `Pass123$`) exists; browser is signed out.

## Steps

1. Open `http://localhost:18080/user/login?returnUrl=//evil.example`.
2. On the Identity sign-in form enter username `alice`, password `Pass123$`, submit.

## Expected result

- After sign-in the browser URL is `http://localhost:18080/` (origin `http://localhost:18080`, path `/`).
- No request is made to host `evil.example` and no response has `Location: http://evil.example/`.
