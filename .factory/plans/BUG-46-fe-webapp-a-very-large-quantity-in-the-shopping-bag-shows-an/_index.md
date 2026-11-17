---
story: BUG-46
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/222"
story-sha: 4781c7c9af90
plan-sha: 2a1016bb02a4
verified-score: 10
verified-at: "2026-11-17T10:53:42.758Z"
verified-by: test-planner@6ab9e852/council
automation-sha: cb4d685c4ddf
automation-plan-sha: 2a1016bb02a4
automation-score: 10
automation-verified-at: "2026-11-17T11:20:03.219Z"
---
# Test plan: BUG-46 A very large quantity in the shopping bag shows an empty page

Scope: on `/cart`, applying a typed quantity that is too large (`5000000000`, pressed Enter) must keep the shopping bag page on screen, leave the item's quantity and the bag totals unchanged (also in the stored basket), show "Enter a smaller quantity." next to that item only, and clear the message once a valid quantity is applied. Quantities that work today (2) keep working. Everything runs on the `e2e` layer because the bug and its fix live in the Blazor WebApp's form post and rendering; no API contract changes. All cases sign in as the seeded user `bob` (password `Pass123$`, empty basket in scenario `default`) and use catalog item 7 "Explorer 45L Backpack" ($149.99). Each case starts from a reloaded scenario so bob's bag is empty.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-46-01 | Typing 2 and pressing Enter updates the item quantity and the bag totals | happy | e2e | Expected: quantities that work today (2) still work |
| TC-BUG-46-02 | Typing 5000000000 and pressing Enter keeps the bag page with header, item, totals and shows "Enter a smaller quantity." | sad | e2e | Expected: page stays on screen; message next to the item; Actual (empty page) must not happen |
| TC-BUG-46-03 | After a too-large quantity, the item quantity stays 1 and the totals are unchanged, also after a reload | sad | e2e | Expected: quantity stays 1, totals unchanged |
| TC-BUG-46-04 | The message disappears once a valid quantity is applied after a too-large one | happy | e2e | Expected: message goes away once a valid quantity is applied |
| TC-BUG-46-05 | With two items in the bag, the message appears only next to the item with the too-large quantity | sad | e2e | Expected: message "next to that item" |

## Out of scope

- API-level tests of Basket.API: the fix is in the WebApp page; the gRPC contract is unchanged.
- Unit tests of `CartPage` internals (`IsValidQuantity`, `CurrentOrPendingQuantity`): the ticket's contract is the observable page.
- Signed-out access to `/cart`: unchanged by this bug.

## Open questions

- The ticket does not say where "too large" starts. The implementation notes treat any value that does not fit a 32-bit `int` (above 2147483647) as invalid; the ticket only fixes `5000000000`. No case asserts behaviour at 2147483647 / 2147483648, or for quantities above available stock.
- The ticket does not define behaviour for negative, zero, decimal or non-numeric typed values (the input is `type="number" min="1"`, the Remove button posts 0). No case covers them.
- The ticket does not say whether "Enter a smaller quantity." is still shown after the page is reloaded without applying a valid quantity; it only says the message goes away once a valid quantity is applied. TC-BUG-46-03 asserts nothing about the message after its reload.
- Clicking the "+" stepper when the quantity is already 2147483647 (overflow to a negative value) is mentioned only in the implementation notes; the ticket does not describe it.
