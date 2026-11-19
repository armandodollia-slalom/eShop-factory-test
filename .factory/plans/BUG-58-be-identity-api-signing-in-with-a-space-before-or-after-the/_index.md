---
story: BUG-58
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/348"
story-sha: 17421fed0122
plan-sha: b4e0ae057d26
verified-score: 10
verified-at: "2026-11-19T22:32:34.000Z"
verified-by: test-planner@3b45d17c/council
automation-sha: 31a5bd24f997
automation-plan-sha: b4e0ae057d26
automation-score: 10
automation-verified-at: "2026-11-19T22:46:06.320Z"
---
# Test plan: BUG-58 [BE - Identity.API] - Signing in with a space before or after the user name says the user name or password is wrong

Scope: the sign-in page of the Identity service (`POST /Account/Login`), reached from the WebApp's "Sign in" button. Spaces before or after the user name must be ignored, so `alice` followed by a space and `alice` preceded by a space with alice's password sign in as alice exactly as `alice` does, while a wrong user name or a wrong password is still refused with "Invalid username or password". Every case runs on the `e2e` layer (`e2e/teststack/`): Identity.API has no unit or functional test project in this repository, and the bug is only observable through the real sign-in round trip (Identity form post, cookie, redirect back to the WebApp).

Data: scenario `default` (users `alice` and `bob`, password `Pass123$`). Sign-in uses `lockoutOnFailure: true`, so the refusal cases use `bob` and each makes exactly one failed attempt; the success cases use `alice`.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-58-01 | User name with a trailing space signs in as alice | happy | e2e | What should happen: `alice` followed by a space signs in as alice |
| TC-BUG-58-02 | User name with a leading space signs in as alice | happy | e2e | What should happen: `alice` preceded by a space signs in as alice |
| TC-BUG-58-03 | User name with spaces on both sides signs in as alice | happy | e2e | What should happen: spaces before or after are ignored (both at once) |
| TC-BUG-58-04 | The exact user name still signs in as alice | happy | e2e | What happens: `alice` works; "exactly as `alice` does" |
| TC-BUG-58-05 | A spaced user name with a wrong password is still refused | sad | e2e | What should happen: a wrong password is still refused as today |
| TC-BUG-58-06 | A spaced unknown user name with a valid password is still refused | sad | e2e | What should happen: a wrong user name is still refused as today |

## Out of scope

- The WebApp, Basket, Catalog and Ordering services: the fix is in Identity.API only; the WebApp is used only to reach the sign-in page and to show the signed-in state.
- Other Identity pages (register, external login, logout): the story names only the sign-in page.
- The user name shown in the re-rendered form after a failed attempt, and the user name recorded in the `UserLoginFailureEvent`: these come from the Implementation Notes, not from the ticket's expected behaviour.

## Open questions

- Password with spaces around it (for example `Pass123$` followed by a space): the ticket only says spaces around the *user name* are ignored; the notes say the password is left as it is. Whether such a password must be refused is not stated by the ticket, so no case asserts it.
- A user name made only of space characters: the ticket does not say what the page shows (the notes say `[Required]` still rejects a null name, but a whitespace-only name becomes an empty string after trimming). No case.
- Whitespace other than the space character (tab, non-breaking space) around the user name: the ticket says "space"; behaviour for other whitespace is undefined.
- Spaces inside the user name (for example `al` and `ice` joined by a space): not addressed by the ticket.
