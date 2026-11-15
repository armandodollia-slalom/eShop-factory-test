---
story: WHK-1
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/104"
story-sha: 135f8709f92d
plan-sha: 77a46d8d354c
verified-score: 9
verified-at: "2026-11-15T02:57:10.615Z"
verified-by: test-planner@aebddb93/f37226b9
automation-sha: 47504318ad40
automation-plan-sha: 77a46d8d354c
automation-score: 10
automation-verified-at: "2026-11-15T03:08:06.082Z"
---
# Test plan: WHK-1 [FE - WebhookClient] - Remove a registered webhook from the webhooks client

Scope: the `Remove` button on each row of the registered webhooks list on the webhooks client home page (`/`), the in-place removal of the row, the `None registered` empty state after the last removal, isolation between users, and the `This webhook no longer exists.` message when the subscription is already gone. All behaviour is user-visible, so the cases run at the `e2e` layer through the WebhookClient on the test stack, except the cross-user isolation guarantee of `DELETE /api/webhooks/{id}`, which is also checked at the `functional` layer against Webhooks.API.

Test data: scenario `whk-1` (`extends: default`), the seeded users `alice` and `bob` (password `Pass123$`) and no webhook subscriptions. Each case registers its own webhooks through the client's `/add-webhook` page (Token field, `Register` button); every row is identified by its Token column value. The stack's WebhookClient runs with `ValidateToken` unset (false), so any token passes the grant check.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-WHK-1-01 | Each registered webhook row has exactly one button labeled Remove | happy | e2e | Inputs: Remove button; Outputs: button labeled exactly `Remove` |
| TC-WHK-1-02 | Removing one of two webhooks removes its row in place and keeps the other | happy | e2e | AC1 (row disappears, other stays); Outputs: deletes without leaving the page |
| TC-WHK-1-03 | A removed webhook is still gone after the page is reloaded | happy | e2e | AC1 (after a reload still gone); Outputs: deletes the subscription through Webhooks.API |
| TC-WHK-1-04 | Removing the last webhook shows None registered | happy | e2e | AC2; Outputs: `None registered` |
| TC-WHK-1-05 | Alice removing her webhook leaves Bob's webhook registered | sad | e2e | AC3; Outputs: only the signed-in user's subscription is affected |
| TC-WHK-1-06 | DELETE of another user's subscription id leaves that subscription in place | sad | functional | AC3; Outputs: other users' subscriptions are unchanged |
| TC-WHK-1-07 | Removing a webhook already deleted in another tab shows This webhook no longer exists. and reloads the list | sad | e2e | AC4; Outputs: `This webhook no longer exists.` and the list is reloaded |

## Out of scope

- Registering webhooks (`/add-webhook`) and receiving webhook messages: used only as setup, not under test.
- The anonymous home page (`Log in to view or edit webhook registrations`): unchanged by this story and not mentioned in it.
- Webhooks.API `DELETE /api/webhooks/{id}` itself beyond cross-user isolation: the story states it already exists and is unchanged.

## Open questions

- The ticket does not define what the page shows when `DELETE` fails with a status other than success or 404 (Webhooks.API down, 500, 401). The Implementation Notes choose `The webhook could not be removed. Please try again.` and keep the row; no case is written because the ticket's outputs do not state it.
- The ticket does not say whether an earlier message (for example `This webhook no longer exists.`) is cleared on the next `Remove` click; the Implementation Notes say it is. No case is written.
- The ticket does not define the HTTP status Webhooks.API returns when another user's id is deleted (the notes say 404); TC-WHK-1-06 asserts only that the subscription is unchanged.
- The ticket does not define behaviour for double-clicking `Remove` or concurrent removals beyond AC4.
