---
story: BUG-55
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/303"
story-sha: f2841bc9c4fe
plan-sha: 397ba0af306d
verified-score: 10
verified-at: "2026-11-19T01:14:43.161Z"
verified-by: test-planner@3b45d17c/council
automation-sha: 6908c9658b4f
automation-plan-sha: 397ba0af306d
automation-score: 9
automation-verified-at: "2026-11-19T01:28:57.542Z"
---
# Test plan: BUG-55 After several wrong passwords, the right password is still refused as wrong

Scope: the Identity.API sign-in page (`/Account/Login`, reached from the WebApp's sign-in link) when a shopper enters the correct password after repeated wrong ones. Identity.API uses ASP.NET Identity's default lockout (no `Lockout` options are set in `src/Identity.API/Program.cs`: 5 failed attempts, 5-minute lockout, `lockoutOnFailure: true` in `AccountController.Login`). The contract is the ticket's "What should happen": a correct password either signs the shopper in or tells them plainly why they cannot sign in right now and what to do, and is never reported as wrong. There is no Identity test project (`tests/` has no `Identity.*Tests`), so every case runs on the `e2e` layer through the WebApp on the test stack.

Test data: scenario `bug-55` (`extends: default`) adds dedicated users so the lockout these cases cause never leaks into other specs that sign in as `alice` or `bob`. Each user row copies every column of `bob`'s row in `default/identitydb.sql` (so its password is the same as `bob`'s seeded password) except `Id`, `UserName`, `NormalizedUserName`, `Email`, `NormalizedEmail`, `SecurityStamp`, `ConcurrencyStamp`, `LockoutEnd` and `AccessFailedCount`, which are set per user:

| UserName | LockoutEnd | AccessFailedCount | Used by |
| --- | --- | --- | --- |
| `bug55-retry` | NULL | 0 | TC-BUG-55-01 |
| `bug55-typo` | NULL | 0 | TC-BUG-55-02 |
| `bug55-locked` | `2099-01-01 00:00:00+00` | 0 | TC-BUG-55-06 |
| `bug55-expired` | `2020-01-01 00:00:00+00` | 0 | TC-BUG-55-05 |

`alice` (TC-BUG-55-06) is the seeded `default` user. "The correct password" below means the seeded password of `bob`/`alice` from the `default` scenario's description; "a wrong password" means the literal `factoryfake-wrong-0001`.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-55-01 | Correct password after five wrong ones is never reported as wrong | sad | e2e | What happens steps 1-3; What should happen: signed in, or told plainly why and to wait; never told a correct password is wrong |
| TC-BUG-55-02 | Correct password after four wrong ones (just below the lockout limit) signs the shopper in | happy | e2e | What should happen: correct password signs the shopper in; boundary just inside the lockout limit of five |
| TC-BUG-55-05 | Correct password after the lockout has ended signs the shopper in | happy | e2e | What happens: refusal lasts "a few minutes"; What should happen: signed in |
| TC-BUG-55-06 | alice signs in with her correct password while another account is locked out | happy | e2e | What happens: "Signing in as alice with her correct password works as usual" |

## Out of scope

- The WebApp's own pages after sign-in beyond confirming the shopper is signed in (user name shown in the header).
- Changing the lockout thresholds or duration; the plan uses ASP.NET Identity's defaults as configured today.
- The "not allowed" sign-in result (`SignInResult.IsNotAllowed`): Identity.API sets no `SignIn.RequireConfirmed*` option, so no seeded or creatable account can reach it through the UI; see Open questions.

## Open questions

- Which message the fifth wrong attempt itself shows. With `lockoutOnFailure: true` the fifth failure locks the account and returns `LockedOut`, so after the fix it may show the lockout message instead of "Invalid username or password". The ticket only states the outcome for the correct password, so TC-BUG-55-01 asserts nothing about the fifth attempt's message.
- Which message a wrong password shows while the account is locked out. The ticket only defines the outcome for the correct password; no case asserts it.
- Whether a correct password during lockout should sign the shopper in or be refused with an explanation. The ticket allows either, so TC-BUG-55-01 accepts both outcomes and no case requires the lockout to keep refusing a correct password.
- The exact wording of the lockout message. The ticket asks for a plain reason and what to do; TC-BUG-55-01 asserts, for the refusal outcome, that the message is not "Invalid username or password", that it says the account is locked (contains "locked") and that it tells the shopper to wait and try again (contains "wait" and "try again"), not the full sentence.
- Whether a "not allowed" (unconfirmed account) explanation is required. It is unreachable with today's configuration; if the product enables account confirmation, a case should be added.
