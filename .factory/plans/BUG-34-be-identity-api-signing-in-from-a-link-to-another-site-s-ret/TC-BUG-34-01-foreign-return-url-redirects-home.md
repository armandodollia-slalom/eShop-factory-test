---
id: TC-BUG-34-01
type: sad
sad-path: validation
layer: e2e
covers: ["Steps to Reproduce 1-2", "Expected: lands on Identity.API's home page", "Expected: the other site's address is never followed", "Expected: no error page is shown"]
priority: P1
---

# TC-BUG-34-01: Sign-in with a return URL to another site redirects to Identity.API's home page instead of returning 500

## Why

- This is the exact reproduction from the ticket: before the fix the `POST /Account/Login` threw on a non-local return URL and answered `500`. The case pins the fixed contract (a `302` to `/`, never to `example.com`). It runs at e2e because Identity.API has no functional test project and the sign-in needs the real form post with its antiforgery token and cookies on the test stack.

## Preconditions

- Test stack up with scenario `default`; user `alice` with password `Pass123$` exists.
- A fresh browser context with no Identity.API cookies.

## Steps

1. Open `${identity}/Account/Login?ReturnUrl=https%3A%2F%2Fexample.com%2Flanding` in the browser.
2. Fill the field with placeholder `Username` with `alice` and the field with placeholder `Password` with `Pass123$`.
3. Click the button `Login` and capture the response to `POST ${identity}/Account/Login`.
4. Wait for the navigation that follows to finish.

## Expected result

- The `POST /Account/Login` response has status `302` (not `500`).
- Its `Location` header is exactly `/`.
- The browser made no request to any URL whose host is `example.com`.
- After the navigation, the page URL is `${identity}/` (origin of the `identity` service, path `/`, no query string).
