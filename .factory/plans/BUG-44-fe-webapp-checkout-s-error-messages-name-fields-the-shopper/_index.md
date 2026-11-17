---
story: BUG-44
story-issue: "https://github.com/armandodollia-slalom/eShop-factory-test/issues/213"
story-sha: 354d93613f37
plan-sha: 9e1b3730301e
verified-score: 10
verified-at: "2026-11-17T06:09:33.746Z"
verified-by: test-planner@6ab9e852/council
automation-sha: e4fc04b93711
automation-plan-sha: 9e1b3730301e
automation-score: 10
automation-verified-at: "2026-11-17T06:35:03.850Z"
---
# Test plan: BUG-44 Checkout's error messages name fields the shopper cannot see

Display-only bug fix in the WebApp checkout page (`/checkout`): when shipping address fields are left empty and the shopper clicks **Place order**, the required-field messages under **Address** and **Zip code**, and the same entries in the validation summary next to the button, must name the fields by their visible labels ("Address", "Zip code") instead of the model property names ("Street", "ZipCode"). City, State and Country messages, the "no order on invalid input" rule and the successful order with every field filled are unchanged. All cases are Playwright e2e specs on the test stack signed in as the seeded user `bob` (scenario `default`) with "Explorer 45L Backpack" in the shopping bag, because the messages only exist in the rendered WebApp and the WebApp has no unit test project.

| ID | Title | Type | Layer | Covers |
| --- | --- | --- | --- | --- |
| TC-BUG-44-01 | Empty Address shows "The Address field is required." under Address | sad | e2e | Expected: message under Address names "Address"; Actual: "Street"; Steps 1-4 |
| TC-BUG-44-02 | Empty Zip code shows "The Zip code field is required." under Zip code | sad | e2e | Expected: message under Zip code names "Zip code"; Actual: "ZipCode"; Steps 1-4 |
| TC-BUG-44-03 | Empty City, State and Country keep their unchanged required messages | sad | e2e | Expected: City, State and Country messages unchanged |
| TC-BUG-44-04 | The validation summary next to Place order lists the five messages with the visible names | sad | e2e | Expected: list next to Place order uses the same names; Actual: list repeats both names |
| TC-BUG-44-05 | Submitting with every address field empty places no order | sad | e2e | Expected: no order is placed |
| TC-BUG-44-06 | Only the empty fields show a message when Address and Zip code alone are cleared | sad | e2e | Expected: every empty field shows that it is required (per-field, renamed fields) |
| TC-BUG-44-07 | With every address field filled, Place order places the order | happy | e2e | Expected: with every field filled in, the order is placed as today |

## Out of scope

- Unit and functional layers: no API, Basket, Ordering or domain behaviour changes; the form model property names (`Street`, `ZipCode`) and the order payload stay the same.
- Payment fields and the "Your cart is empty" message: the story does not change them.
- Other pages' validation messages.

## Open questions

- The story gives the new messages "for example". The plan asserts the exact default `[Required]` wording with the label ("The Address field is required.", "The Zip code field is required."), the most literal reading of the examples.
