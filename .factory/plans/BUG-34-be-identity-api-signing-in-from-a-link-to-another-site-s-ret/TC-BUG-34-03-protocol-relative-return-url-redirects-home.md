---
id: TC-BUG-34-03
type: sad
sad-path: boundary
layer: e2e
covers: ["Expected: the other site's address is never followed", "Expected: no error page is shown"]
priority: P2
---

# TC-BUG-34-03: Sign-in with a protocol-relative return URL to another site redirects to the home page

## Why

- `//example.com/landing` starts with `/` like a local path but points to another site; it is the boundary between "a return URL on Identity.API itself" and "another site". If it were treated as local, the browser would follow it to `example.com`, which the ticket forbids. e2e for the same reasons as TC-BUG-34-01.

## Preconditions

- Test stack up with scenario `default`; user `alice` with password `Pass123$` exists.
- A fresh browser context with no Identity.API cookies.

## Steps

1. Open `${identity}/Account/Login?ReturnUrl=%2F%2Fexample.com%2Flanding`.
2. Fill `Username` with `alice` and `Password` with `Pass123$`.
3. Click `Login` and capture the response to `POST ${identity}/Account/Login`.
4. Wait for the navigation that follows to finish.

## Expected result

- The `POST /Account/Login` response has status `302` (not `500`) and its `Location` header is exactly `/`.
- The browser made no request to any URL whose host is `example.com`.
- After the navigation, the page URL is `${identity}/`.
