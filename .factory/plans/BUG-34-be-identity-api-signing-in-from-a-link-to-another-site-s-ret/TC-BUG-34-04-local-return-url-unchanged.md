---
id: TC-BUG-34-04
type: happy
layer: e2e
covers: ["Expected: signing in with a return URL on Identity.API itself behaves as it does today"]
priority: P1
---

# TC-BUG-34-04: Sign-in with a local return URL still redirects to that Identity.API page

## Why

- The fix changes the branch right after the local-URL check; the ticket requires a return URL on Identity.API itself to keep working. A regression here would strand every user who signs in from an Identity.API page. `/grants` is used because it is a real local page that only renders for a signed-in user, so one navigation proves both the redirect and the session.

## Preconditions

- Test stack up with scenario `default`; user `alice` with password `Pass123$` exists.
- A fresh browser context with no Identity.API cookies.

## Steps

1. Open `${identity}/Account/Login?ReturnUrl=%2Fgrants`.
2. Fill `Username` with `alice` and `Password` with `Pass123$`.
3. Click `Login` and capture the response to `POST ${identity}/Account/Login`.
4. Wait for the navigation that follows to finish.

## Expected result

- The `POST /Account/Login` response has status `302` and its `Location` header is exactly `/grants`.
- After the navigation, the page URL is `${identity}/grants` and the page shows the heading `Client Application Permissions`.
