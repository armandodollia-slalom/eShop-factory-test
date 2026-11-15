---
id: TC-BUG-34-05
type: happy
layer: e2e
covers: ["Expected: signing in with no return URL behaves as it does today"]
priority: P2
---

# TC-BUG-34-05: Sign-in with no return URL still redirects to the home page

## Why

- The ticket requires sign-in without a return URL to behave as before (redirect to `/`). The empty-URL branch sits next to the changed branch, so a reordering mistake could send it elsewhere or throw. e2e for the same reasons as TC-BUG-34-01.

## Preconditions

- Test stack up with scenario `default`; user `alice` with password `Pass123$` exists.
- A fresh browser context with no Identity.API cookies.

## Steps

1. Open `${identity}/Account/Login` (no query string).
2. Fill `Username` with `alice` and `Password` with `Pass123$`.
3. Click `Login` and capture the response to `POST ${identity}/Account/Login`.

## Expected result

- The `POST /Account/Login` response has status `302` and its `Location` header is exactly `/`.
- Opening `${identity}/grants` afterwards in the same context returns `200` and shows the heading `Client Application Permissions`.
