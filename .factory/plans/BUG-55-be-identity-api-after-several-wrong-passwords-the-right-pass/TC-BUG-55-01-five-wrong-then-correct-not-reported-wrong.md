---
id: TC-BUG-55-01
type: sad
sad-path: auth
layer: e2e
covers: ["What happens steps 1-3", "What should happen: either signed in or told plainly why they cannot be signed in and what to do", "What should happen: never told a correct password is wrong"]
priority: P1
---

# TC-BUG-55-01: Correct password after five wrong ones is never reported as wrong

## Why

- This is the ticket's exact reproduction: after five wrong passwords, the correct password was answered with "Invalid username or password". The ticket accepts two outcomes for the correct password (signed in, or a plain explanation with what to do), so the case accepts either and fails only on the reported defect or on a refusal that gives no reason and no hint to wait. It must run on e2e because the defect is the message the shopper reads on the Identity sign-in page, and Identity.API has no in-process test project. A dedicated user (`bug55-retry`) keeps any lockout from breaking other specs that sign in as `bob`.

## Preconditions

- Test stack up with scenario `bug-55`; user `bug55-retry` exists with `LockoutEnd` NULL, `AccessFailedCount` 0, `LockoutEnabled` true and `bob`'s password hash.
- Browser context with no session cookies.

## Steps

1. Open the WebApp home page and click the sign-in link; wait for the Identity login form (`/Account/Login`).
2. Enter user name `bug55-retry` and password `factoryfake-wrong-0001`, click the login button. Repeat this step until it has been submitted five times in total, waiting for the login form to reload after each submit.
3. Enter user name `bug55-retry` and the correct password (the seeded `bob` password), click the login button.

## Expected result

- After step 2's first four submits, the page shows "Invalid username or password" each time.
- After step 3, the page does NOT show "Invalid username or password".
- After step 3, exactly one of these holds:
  - the browser is redirected back to the WebApp (URL not on `/Account/Login`) and the WebApp header shows the signed-in user menu instead of the sign-in link; or
  - the browser is still on `/Account/Login` and the validation summary contains the word "locked" (case-insensitive), the word "wait" (case-insensitive) and the phrase "try again" (case-insensitive), telling the shopper why sign-in failed and that waiting will help.
