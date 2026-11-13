---
story: BUG-16
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/33"
story-sha: 8313c5a60d10
plan-sha: 1f0b02b0c784
verified-score: 10
verified-at: "2026-11-13T20:17:33.849Z"
verified-by: test-planner@a978a288/27d172f2
automation-sha: 803a506359d4
automation-plan-sha: 1f0b02b0c784
automation-score: 10
automation-verified-at: "2026-11-13T20:59:46.001Z"
---
# Test plan: BUG-16 Webhooks.API accepts numeric event names outside the allowed list

Scope: `POST /api/webhooks/` must reject any `event` value that is not a defined `WebhookType` member (`CatalogItemPriceChange`=1, `OrderShipped`=2, `OrderPaid`=3), including numeric strings such as `99`, with `400` and `"<event> is invalid event name"`, and must store nothing. Defined names and numeric strings naming a defined member keep working. All cases run at the functional layer (`tests/Webhooks.FunctionalTests`, in-process API with the fixture's stubbed grant URL tester).

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-16-01 | Numeric event name 99 outside WebhookType is rejected with 400 | sad | functional | Expected result, AC 1 |
| TC-BUG-16-02 | Rejected numeric event does not store a subscription | sad | functional | Actual (stored type 99) |
| TC-BUG-16-03 | Event "0" (just below lowest defined value) is rejected | sad | functional | Boundary |
| TC-BUG-16-04 | Event "4" (just above highest defined value) is rejected | sad | functional | Boundary |
| TC-BUG-16-05 | Negative numeric event "-1" is rejected | sad | functional | Decisions |
| TC-BUG-16-06 | Event larger than Int32 is rejected | sad | functional | Boundary |
| TC-BUG-16-07 | Non-numeric unknown event name is still rejected | sad | functional | Message format unchanged |
| TC-BUG-16-08 | Numeric string naming a defined member ("1") is still accepted | happy | functional | Decisions |
| TC-BUG-16-09 | Valid event name in different casing is accepted | happy | functional | Enum.TryParse ignoreCase |
| TC-BUG-16-10 | Empty event name is rejected | sad | functional | Validation |
| TC-BUG-16-11 | Comma-combined event values are rejected | sad | functional | Expected result, Enum.TryParse flags |

## Out of scope

- The Playwright spec `e2e/teststack/webhooks-subscriptions.spec.ts` (its `test.fixme` marker) and the `testing/flows/` bugs table: they do not exist in this repository.
- UI/e2e cases: the story is backend-only.

## Open questions

- Authentication (no token / wrong user) on `POST /api/webhooks/` is not mentioned by the story; no case written.
- Exact 400 body shape: the story says `400 BadRequest "99 is invalid event name"`; the endpoint filter returns a validation problem with the message under `errors.Event`. Cases assert the latter.
- Whitespace-padded values (e.g. `" 1"`), null `event`, and a request with several simultaneous errors are not specified; no cases.
