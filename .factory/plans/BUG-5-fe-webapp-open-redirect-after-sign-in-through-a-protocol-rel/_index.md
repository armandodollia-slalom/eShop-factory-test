---
story: BUG-5
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/64"
story-sha: dd60d09dd157
plan-sha: 16dde264702b
verified-score: 9
verified-at: "2026-11-14T13:14:58.268Z"
verified-by: test-planner@476d82b5/27d172f2
automation-sha: 1aaa91ba3966
automation-plan-sha: 16dde264702b
automation-score: 10
automation-verified-at: "2026-11-14T13:23:37.386Z"
---
# Test plan: BUG-5 [FE - WebApp] Open redirect after sign-in through a protocol-relative returnUrl

Scope: the sign-in return URL handling on `/user/login` (`LogIn.razor` calling `eShop.WebApp.LocalReturnUrl.ToLocalOrRoot`). Off-site return URLs (`//host`, `/\host`, `\host`, `https://host`, control characters) must end at `/`; local and base-relative paths are kept; missing or empty goes to `/`. E2E cases prove the browser behaviour on the test stack; unit cases pin the helper rule exactly.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-5-01 | Protocol-relative returnUrl does not leave the site after sign-in | sad | e2e | Expected, Steps to Reproduce |
| TC-BUG-5-02 | Local return URL is still honored after sign-in | happy | e2e | Code map: local return URL kept |
| TC-BUG-5-03 | Base-relative returnUrl produced by LogIn.Url lands on the item page | happy | e2e | Decisions: base-relative URLs |
| TC-BUG-5-04 | returnUrl /\evil.example does not leave the site | sad | e2e | Suggested fix: not followed by `\` |
| TC-BUG-5-05 | Absolute returnUrl https://evil.example/ does not leave the site | sad | e2e | Code map: https://host to / |
| TC-BUG-5-06 | ToLocalOrRoot("//evil.example") returns "/" | sad | unit | Suggested fix: not followed by `/` |
| TC-BUG-5-07 | ToLocalOrRoot("/\evil.example") returns "/" | sad | unit | Suggested fix: not followed by `\` |
| TC-BUG-5-08 | ToLocalOrRoot("\evil.example") returns "/" | sad | unit | Decisions: backslash-prefixed |
| TC-BUG-5-09 | ToLocalOrRoot("https://evil.example/") returns "/" | sad | unit | Code map: https://host to / |
| TC-BUG-5-10 | ToLocalOrRoot with a control character returns "/" | sad | unit | Decisions: control characters |
| TC-BUG-5-11 | ToLocalOrRoot keeps local paths unchanged | happy | unit | Code map: local return URL kept |
| TC-BUG-5-12 | ToLocalOrRoot makes a base-relative path root-relative | happy | unit | Decisions: item/5 to /item/5 |
| TC-BUG-5-13 | ToLocalOrRoot with null or empty input returns "/" | sad | unit | Code map: missing or empty return URL |

## Out of scope

- Removing the `test.fixme` marker and the bugs-table row in `testing/flows/` (repository housekeeping, not behaviour).
- Changes to `LogIn.Url(nav)` (unchanged per the story).

## Open questions

- The story refers to `e2e/teststack/auth-login.spec.ts`, the `auth-lockout` scenario and `testing/` files; the story note says they do not exist in this repository. Cases use scenario `default` with user alice and a new spec file.
- Behaviour for return URLs that are percent-encoded after decoding (e.g. `%2F%2Fevil.example` double-encoded) is not stated; no case.
- Which unit test project hosts the WebApp helper test is not stated (no `WebApp.UnitTests` exists); the case names the behaviour only.
