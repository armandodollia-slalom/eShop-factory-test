---
id: TC-BUG-34-02
type: sad
sad-path: validation
layer: e2e
covers: ["Expected: Alice is signed in"]
priority: P1
---

# TC-BUG-34-02: Sign-in with a return URL to another site leaves alice signed in

## Why

- The ticket requires a signed-in session, not only the absence of the error: a fix that redirected home but dropped the sign-in cookie would pass TC-BUG-34-01 and still break the user. It is a separate case because it checks session state, which is observed through an `[Authorize]` page (`/grants`) in the same browser context on the test stack.

## Preconditions

- Test stack up with scenario `default`; user `alice` with password `Pass123$` exists.
- A fresh browser context with no Identity.API cookies.

## Steps

1. Open `${identity}/Account/Login?ReturnUrl=https%3A%2F%2Fexample.com%2Flanding`.
2. Fill `Username` with `alice` and `Password` with `Pass123$`, then click `Login` and wait for the `POST ${identity}/Account/Login` response.
3. In the same browser context, open `${identity}/grants`.

## Expected result

- The `GET /grants` response has status `200` and the page URL stays `${identity}/grants` (no redirect to `/Account/Login`).
- The page shows the heading `Client Application Permissions`.
