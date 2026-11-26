---
story: BUG-34
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/116"
story-sha: d03ae73bb73b
plan-sha: 0c71f77f93cf
verified-score: 10
verified-at: "2026-11-15T06:45:07.227Z"
verified-by: test-planner@1edb523e/67b01306
automation-sha: 75cc4ec81374
automation-plan-sha: 0c71f77f93cf
automation-score: 10
automation-verified-at: "2026-11-15T07:44:56.565Z"
---
# Test plan: BUG-34 [BE - Identity.API] - Signing in from a link to another site's return URL shows an error page

Scope: the username/password sign-in of Identity.API (`GET /Account/Login` form, `POST /Account/Login`) on the test stack. With a return URL that points to another site, a correct sign-in must end in a signed-in session and a redirect to Identity.API's home page (`/`), never to the other site and never in a `500`. Sign-in with a return URL on Identity.API itself (a local page, or an authorization request) and with no return URL must behave as before. All cases are `e2e` (Playwright, `e2e/teststack/`) against the `identity` service: there is no Identity.API functional test project, the acceptance criterion is stated on the test stack, and the bug lives in the browser form post (antiforgery token, cookies, redirects), which a browser exercises end to end. Scenario `default` (user `alice`, password `Pass123$`) is enough; no extra data. The signed-in check uses `GET /grants`, which is `[Authorize]` and renders the heading "Client Application Permissions" only for a signed-in user.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-34-01 | Sign-in with a return URL to another site redirects to Identity.API's home page instead of returning 500 | sad | e2e | Steps to Reproduce 1-2; Expected: lands on home page, other site never followed, no error page; Actual (500) fixed |
| TC-BUG-34-02 | Sign-in with a return URL to another site leaves alice signed in | sad | e2e | Expected: "Alice is signed in" |
| TC-BUG-34-03 | Sign-in with a protocol-relative return URL to another site redirects to the home page | sad | e2e | Expected: other site's address never followed (boundary of "another site") |
| TC-BUG-34-04 | Sign-in with a local return URL still redirects to that Identity.API page | happy | e2e | Expected: return URL on Identity.API itself behaves as today |
| TC-BUG-34-05 | Sign-in with no return URL still redirects to the home page | happy | e2e | Expected: no return URL behaves as today |
| TC-BUG-34-06 | Sign-in from an authorization request still returns to the authorize callback | happy | e2e | Expected: return URL on Identity.API itself behaves as today (authorization-context return URL) |

## Out of scope

- The warning written to the log for a rejected return URL: it is an implementation decision recorded in the Implementation Notes, not a requirement of the ticket, and the e2e layer cannot read Identity.API's log.
- Wrong password combined with a return URL to another site: the ticket only describes a correct sign-in; failed sign-in is unchanged by the fix and the ticket states no expectation for it.
- The "Cancel" button with a return URL to another site: already redirected to `/` before the fix and not mentioned by the ticket.
- Native-client (`LoadingPage`) redirects of authorization requests: no native client is registered on the test stack and the ticket does not mention them.

## Open questions

- Identity.API runs on the test stack without `ASPNETCORE_ENVIRONMENT` (so `Production`), and `HomeController.Index` returns `404` with an empty body outside Development. The ticket's "lands on Identity.API's home page … No error page is shown" can therefore only be checked as "the sign-in response redirects to `/` and is not a `500`"; what `GET /` itself should render on the stack is not defined by the ticket, so TC-BUG-34-01, -03 and -05 assert the redirect target and the absence of a `500`, not the status of `GET /`.
