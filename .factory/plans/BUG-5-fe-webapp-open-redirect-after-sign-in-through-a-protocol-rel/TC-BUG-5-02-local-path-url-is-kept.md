---
id: TC-BUG-5-02
type: happy
layer: e2e
covers: ["Expected: local return URL still works"]
priority: P1
---

# TC-BUG-5-02: Local return URL is still honored after sign-in

## Why

- Guards against the fix over-blocking: a legitimate local path must still be the sign-in destination; checked end to end in the browser.

## Preconditions

- Test stack running (`factory teststack up`) with scenario `default`; WebApp at http://localhost:18080.
- User alice (password `Pass123$`) exists; browser is signed out.

## Steps

1. Open `http://localhost:18080/user/login?returnUrl=%2Fuser%2Forders`.
2. Sign in as `alice` / `Pass123$`.

## Expected result

- After sign-in the browser URL is `http://localhost:18080/user/orders`.
