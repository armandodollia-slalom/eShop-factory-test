---
story: ACCT-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/173"
story-sha: 941e650bdd04
plan-sha: 30d5752566cf
verified-score: 10
verified-at: "2026-11-15T23:46:07.447Z"
verified-by: test-planner@d8121b51/67b01306
automation-sha: 7acf6c91e390
automation-plan-sha: 30d5752566cf
automation-score: 9
automation-verified-at: "2026-11-16T00:13:09.775Z"
---
# Test plan: ACCT-1 [FE - WebApp] - My account page

Scope: the new "My account" entry in the WebApp user menu, the `/user/account` page (heading, tab title, the signed-in user's name, email and shipping address read from their claims), that each user sees only their own details, the sign-in redirect for anonymous visitors with return to `/user/account`, and that "My orders" and "Log out" keep working. Everything is visible only in the browser, so every case is `e2e` on the test stack (scenario `default`, users `alice` and `bob`, password `Pass123$`).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-ACCT-1-01 | User menu lists "My account" directly above "My orders" | happy | e2e | AC1 |
| TC-ACCT-1-02 | "My account" link opens /user/account | happy | e2e | AC1 |
| TC-ACCT-1-03 | Account page heading is "My account" and tab title is "My account \| AdventureWorks" | happy | e2e | AC2 |
| TC-ACCT-1-04 | Account page shows alice's name, email and shipping address | happy | e2e | AC2 |
| TC-ACCT-1-05 | Account page shows bob's own name and email and none of alice's | sad | e2e | AC3 |
| TC-ACCT-1-06 | After alice logs out and bob signs in in the same browser, the page shows only bob's details | sad | e2e | AC3 |
| TC-ACCT-1-07 | Anonymous visitor opening /user/account is sent to sign in | sad | e2e | AC4 |
| TC-ACCT-1-08 | Signing in as alice from the redirect lands on /user/account | happy | e2e | AC4 |
| TC-ACCT-1-09 | "My orders" is still in the user menu and opens the orders page | happy | e2e | AC5 |
| TC-ACCT-1-10 | "Log out" is still in the user menu and signs the user out | happy | e2e | AC5 |

## Out of scope

- Editing account details: the story only displays them.
- Unit or functional tests: the page reads claims in the WebApp and has no API; the story adds no service call.
- Rendering with missing claims (empty or partial values): described only in the Implementation Notes, not in the acceptance criteria, and the seeded users have every claim (see Open questions).

## Open questions

- AC3: bob is seeded with the same street, city, state, zip and country as alice ("15703 NE 61st Ct, Redmond, WA 98052, U.S."), so "nothing of alice's" can only be checked on name and email. A scenario where bob has a different address would make the address part checkable; the plan does not require one.
- The story does not say what the page shows when a claim is missing (the notes say it renders empty or partial values instead of failing); no case asserts it.
- The story does not name the exact sign-in page URL; cases assert the browser is on the Identity service's login page (its origin from the test stack ports) with the Username/Password form.
