# Lessons: test-planner

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-planner agent's instructions on every run.

## L2: Before finishing, verify every name, id, scenario and tool a case mentions against the repository
<!-- category: vague-steps; subtype: ; added: 2026-11-14 -->

Vague steps recur even with "write concrete values" advice, because the gaps are usually unverified references, not missing adjectives. Run this checklist over each case: (1) the title repeats the exact input used in the steps; (2) every seeded user, catalog item, order or basket named in preconditions exists in the named scenario (open the scenario files) or the case says how it is created; (3) every class, project and file named (helper, test project, scenario) exists in the repository today, with its real name and visibility; if it does not, say which project hosts the new test; (4) every authenticated step names the mechanism (which user, how the token or session is obtained); (5) every UI step names the control (button label or selector), the expected redirect, and how the test waits for asynchronous effects; (6) no "or", "any", "as prefilled", "unused id". If the story leaves a value open, assert only what it states and list the rest under Open questions.

- Bad: `Precondition: catalog item 99 exists`; `complete the checkout form as prefilled and place the order`; `loadScenario('save-for-later')` when the scenario folder is `cart-1`; `call eShop.WebApp.ReturnUrl.ToLocalOrRoot` when the class is `LocalReturnUrl`.
- Good: `Precondition: scenario cart-1, signed in as alice (token from the identity token endpoint)`; `click "Place order", expect redirect to /user/orders, poll until an order with total $90.00 appears`.

## L3: One case per distinct behavior; merge cases that share a setup and an assertion
<!-- category: duplicate-case; subtype: ; added: 2026-11-14 -->

Before finishing, compare every pair of cases: if they use the same request or basket and assert the same status or fields, merge them (add the extra check to the first case) or drop the weaker one. A different id value only counts as a new case when it crosses a boundary or a separate code branch. Do not claim an AC is covered by a case that only repeats a round-trip another case already performs.

- Bad: three cases POST an existing id (1, 101, 6001) and assert only 409; two cases store the same basket in Redis and read it back.
- Good: one 409 case for an existing id plus one for a boundary that takes a different branch; one round-trip case that checks Items and SavedItems together.
