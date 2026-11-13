---
story: BUG-16
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/33"
story-sha: 9ced0c7f1676
plan-sha: 479d1db561a6
verified-score: 10
verified-at: "2026-11-13T22:28:08.327Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: c4c454d5d64d
automation-plan-sha: 479d1db561a6
automation-score: 10
automation-verified-at: "2026-11-13T22:50:43.856Z"
---
# Test plan: BUG-16 Webhooks.API accepts numeric event names outside the allowed list

Scope: validation of the `event` field of `POST /api/webhooks` in Webhooks.API. Only defined `WebhookType` names may be accepted; numeric values (inside or outside the enum range), comma-combined values and unknown names must return `400 BadRequest` with `<value> is invalid event name` and store nothing. Valid names keep working. All cases are functional (`tests/Webhooks.FunctionalTests`, existing fixture and grant-URL stub).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-16-01 | Numeric event "99" outside WebhookType is rejected | sad | functional | Expected 400; reproduction step |
| TC-BUG-16-02 | Numeric event "0" is rejected | sad | functional | Boundary below enum |
| TC-BUG-16-03 | Numeric event "4" is rejected | sad | functional | Boundary above enum |
| TC-BUG-16-04 | Negative numeric event "-1" is rejected | sad | functional | Purely numeric input |
| TC-BUG-16-05 | Comma-combined event is rejected | sad | functional | Enum.TryParse gap |
| TC-BUG-16-06 | Undefined non-numeric name is still rejected | sad | functional | Regression |
| TC-BUG-16-07 | Each defined WebhookType name is accepted and stored | happy | functional | Regression |
| TC-BUG-16-08 | Event name matched case-insensitively | happy | functional | Regression |

## Out of scope

- The Playwright spec `e2e/teststack/webhooks-subscriptions.spec.ts`, `testing/flows/` bugs table and `test.fixme` removal: these files do not exist in this repository (see story note); the same behavior is covered at the functional layer.
- Authentication, ownership and grant-URL failure behavior (unchanged by this bug).

## Open questions

- Should a numeric string equal to a defined value (e.g. `"2"`) be rejected? The story says numeric names "outside the allowed list" are rejected; the suggested fix allows either `Enum.IsDefined` (would accept "2") or rejecting purely numeric input. No case written.
- Null, empty or whitespace `event`: expected status and message are not stated. No case written.
- Exact response body shape (plain string vs ProblemDetails); cases only assert the body contains `<value> is invalid event name`.
