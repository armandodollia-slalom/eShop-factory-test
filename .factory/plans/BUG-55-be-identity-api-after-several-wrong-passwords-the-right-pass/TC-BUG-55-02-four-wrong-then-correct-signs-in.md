---
id: TC-BUG-55-02
type: happy
layer: e2e
covers: ["What should happen: the shopper is signed in", "Boundary: four failed attempts, one below the lockout limit of five"]
priority: P1
---

# TC-BUG-55-02: Correct password after four wrong ones (just below the lockout limit) signs the shopper in

## Why

- The ticket's first acceptable outcome is "signed in". A shopper who mistypes four times, one below the lockout limit (5), must be signed in by the correct password; this is the boundary just inside the limit and guards against a fix that refuses or locks too early. It is e2e because sign-in completes through the Identity page and redirects back to the WebApp.

## Preconditions

- Test stack up with scenario `bug-55`; user `bug55-typo` exists with `LockoutEnd` NULL, `AccessFailedCount` 0 and `bob`'s password hash.
- Browser context with no session cookies.

## Steps

1. Open the WebApp home page and click the sign-in link; wait for the Identity login form.
2. Enter user name `bug55-typo` and password `factoryfake-wrong-0001`, click the login button; wait for the form to reload. Do this four times in total.
3. Enter user name `bug55-typo` and the correct password, click the login button.

## Expected result

- After each of the four submits in step 2, the page shows "Invalid username or password" and no text containing "locked".
- After step 3, the browser is redirected back to the WebApp (URL is on the WebApp's origin, not `/Account/Login`), and the WebApp header shows the user as signed in (the user menu with the user's name is visible instead of the sign-in link).
