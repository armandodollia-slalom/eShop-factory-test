---
story: PWD-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/311"
story-sha: 56dca137e4e6
plan-sha: f71afd1e8355
verified-score: 9
verified-at: "2026-11-19T01:36:54.058Z"
verified-by: test-planner@3b45d17c/council
automation-sha: c821f0739f8c
automation-plan-sha: f71afd1e8355
automation-score: 10
automation-verified-at: "2026-11-19T02:36:21.396Z"
---
# Test plan: PWD-1 Let shoppers replace their own credentials

Scope: the "Change password" entry in the WebApp user menu (AC1), the change page on Identity.API and its success page (AC2), the refusal of a wrong current password (AC3), of a mismatched confirmation and of new passwords that break Identity.API's rules (AC4), and the sign-in redirect for a visitor who opens the change page directly (AC5). Identity.API has no functional test project, so every case runs on the `e2e` layer through the browser on the test stack.

All cases use the scenario `pwd-1` (`extends: default`), which adds dedicated shoppers to `identitydb` so no case signs in as `alice` or `bob` and no case depends on another's password change. Each user has `EmailConfirmed = true`, `LockoutEnabled = true`, `AccessFailedCount = 0` and the initial password `Factoryfake1$` (stored as an ASP.NET Identity hash generated for that clear text):

| User name | Email | Used by |
| --- | --- | --- |
| `pwd1-menu` | `pwd1-menu@example.test` | TC-PWD-1-01, TC-PWD-1-12 |
| `pwd1-change` | `pwd1-change@example.test` | TC-PWD-1-03 |
| `pwd1-oldrefused` | `pwd1-oldrefused@example.test` | TC-PWD-1-05 |
| `pwd1-wrongcurrent` | `pwd1-wrongcurrent@example.test` | TC-PWD-1-06 |
| `pwd1-mismatch` | `pwd1-mismatch@example.test` | TC-PWD-1-07 |
| `pwd1-rules` | `pwd1-rules@example.test` | TC-PWD-1-08 |
| `pwd1-short` | `pwd1-short@example.test` | TC-PWD-1-09 |
| `pwd1-min` | `pwd1-min@example.test` | TC-PWD-1-10 |
| `pwd1-long` | `pwd1-long@example.test` | TC-PWD-1-11 |
| `pwd1-empty` | `pwd1-empty@example.test` | TC-PWD-1-13 |
| `pwd1-nolower` | `pwd1-nolower@example.test` | TC-PWD-1-14 |
| `pwd1-max` | `pwd1-max@example.test` | TC-PWD-1-15 |

"Sign in as X" in a case means: on the Identity.API login page enter user name X and the password the case names, and submit. `<IdentityUrl>` is the Identity.API base address the WebApp reads from its `IdentityUrl` setting; `<WebAppUrl>` is the WebApp base address (the `WebAppClient` setting of Identity.API).

Identity.API uses ASP.NET Core Identity's default password options (at least 6 characters, one digit, one lowercase, one uppercase, one non-alphanumeric); the view model adds `[Required]`, `[StringLength(100, MinimumLength = 6)]` and `[Compare]`.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-PWD-1-01 | Signed-in shopper's user menu has "Change password" beside "Log out", linking to the Identity change page | happy | e2e | AC1 |
| TC-PWD-1-02 | Visitor who is not signed in sees no "Change password" entry | sad | e2e | AC1 (not shown to visitors) |
| TC-PWD-1-03 | Valid change shows the confirmation and a "Back to the shop" link to the shop home | happy | e2e | AC2 (success message, back link) |
| TC-PWD-1-05 | After a change, the old password is refused at sign-in | sad | e2e | AC2 (old one refused) |
| TC-PWD-1-06 | Wrong current password shows "The current password is incorrect." and changes nothing | sad | e2e | AC3 |
| TC-PWD-1-07 | New and confirmation entries that differ are reported and change nothing | sad | e2e | AC4 (entries differ) |
| TC-PWD-1-08 | New password breaking Identity's character rules shows Identity's own messages and changes nothing | sad | e2e | AC4 (sign-in service's rules) |
| TC-PWD-1-09 | New password of 5 characters (one below minimum) is refused | sad | e2e | AC4 (length rule, just outside) |
| TC-PWD-1-10 | New password of exactly 6 characters (minimum) is accepted | happy | e2e | AC4 (length rule, just inside), AC2 (only the new one works) |
| TC-PWD-1-11 | New password of 101 characters (one above maximum) is refused | sad | e2e | AC4 (length rule, just outside) |
| TC-PWD-1-12 | Opening the change page without an Identity session asks to sign in and returns to the change page | sad | e2e | AC5 |
| TC-PWD-1-13 | Submitting the change form empty shows the required-field messages and changes nothing | sad | e2e | AC2 (asks for all three), AC4 |
| TC-PWD-1-14 | New password without a lowercase letter shows Identity's lowercase message and changes nothing | sad | e2e | AC4 (sign-in service's rules: lowercase) |
| TC-PWD-1-15 | New password of exactly 100 characters (maximum) is accepted | happy | e2e | AC4 (length rule, just inside the maximum), AC2 |

## Out of scope

- Unit tests of `ManageController` internals (error mapping, `RefreshSignInAsync` call): the behaviour is checked through the page in TC-PWD-1-03 and TC-PWD-1-06.
- Password reset for a forgotten password, email notification of a change and signing out other sessions: the story does not ask for them.
- A separate "new password signs in" case: TC-PWD-1-10 and TC-PWD-1-15 already sign in with the new password in a fresh browser after a change.

## Open questions

- AC2 says the sign-in cookie is refreshed after a change, but the story does not say whether other existing sessions of the same shopper are signed out; no case asserts either outcome.
- Whether a wrong current password counts toward lockout (`AccessFailedCount`) is not stated; no case asserts it.
- Concurrent changes from two browsers for the same shopper are not described by the story.
- For an empty form or a too-short new password, the story does not say whether Identity's own message ("Passwords must be at least 6 characters.") or the view model's length message is shown; TC-PWD-1-09 and TC-PWD-1-13 assert the view model's messages, which come from the sign-in service, plus that nothing changed.
