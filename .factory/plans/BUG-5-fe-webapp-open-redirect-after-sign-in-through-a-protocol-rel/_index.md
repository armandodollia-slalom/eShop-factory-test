---
story: BUG-5
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/64"
story-sha: a449a6ac20fe
plan-sha: 4b56b05a9d0e
verified-score: 9
verified-at: "2026-11-14T10:23:07.885Z"
verified-by: test-planner@476d82b5/27d172f2
---
# Test plan: BUG-5 [FE - WebApp] - Open redirect after sign-in through a protocol-relative returnUrl

Scope: after sign-in through `/user/login?returnUrl=...` the WebApp must follow only local return URLs (`LogIn.LocalReturnUrl` in `src/WebApp/Components/Pages/User/LogIn.razor`) and otherwise go to `/`. End-to-end cases prove the browser stays on the site; unit cases cover each input form of the pure helper.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-5-01 | Protocol-relative returnUrl lands on home, not off-site | sad | e2e | Expected, steps to reproduce |
| TC-BUG-5-02 | `/\evil.example` lands on home | sad | e2e | Reject `/\` forms |
| TC-BUG-5-03 | Local path `/item/5` is followed | happy | e2e | Local paths stay allowed |
| TC-BUG-5-04 | Base-relative `item/5` is followed | happy | e2e | Base-relative URLs stay allowed |
| TC-BUG-5-05 | No returnUrl lands on home | happy | e2e | `/` fallback |
| TC-BUG-5-06 | `//evil.example` becomes `/` | sad | unit | Reject leading `//` |
| TC-BUG-5-07 | `/\evil.example` becomes `/` | sad | unit | Reject `/\` |
| TC-BUG-5-08 | `\evil.example` becomes `/` | sad | unit | Reject leading backslash |
| TC-BUG-5-09 | `https://evil.example/` becomes `/` | sad | unit | Reject absolute URIs |
| TC-BUG-5-10 | Leading-space `//evil.example` becomes `/` | sad | unit | Reject whitespace |
| TC-BUG-5-11 | `/<TAB>/evil.example` becomes `/` | sad | unit | Reject control characters |
| TC-BUG-5-12 | null becomes `/` | sad | unit | Empty values |
| TC-BUG-5-13 | Empty string becomes `/` | sad | unit | Empty values |
| TC-BUG-5-14 | `/item/5` unchanged | happy | unit | Local paths allowed |
| TC-BUG-5-15 | `item/5` unchanged | happy | unit | Base-relative allowed |
| TC-BUG-5-16 | `/` unchanged | happy | unit | Single-slash boundary |

## Out of scope

- The `test.fixme` removal in `e2e/teststack/auth-login.spec.ts` and the `testing/flows/` bugs table: those files do not exist in this repository (per the story note).
- The `auth-lockout` scenario: not present here; cases use `default` (alice).

## Open questions

- There is no `tests/WebApp.UnitTests` project and `LocalReturnUrl` is `internal`, so the unit cases need a new test project with `InternalsVisibleTo` on WebApp.
- Return URLs with a query string or fragment (e.g. `/item/5?x=1`) and absolute URLs to the WebApp's own origin are not specified; no cases written.
- The story's Expected for non-local URLs is `/`; the exact final URL after Identity sign-in redirects is assumed to be `<webapp>/`.
