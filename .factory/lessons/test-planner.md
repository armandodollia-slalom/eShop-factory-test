# Lessons: test-planner

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-planner agent's instructions on every run.

## L2: Before finishing, check every name, value and mechanism in each case against the repository and the story
<!-- category: vague-steps; subtype: ; added: 2026-11-14 -->

Go case by case and confirm each of these, then fix the case text:

- Every scenario, class, file, project, seeded id, user and button label you name exists in the repository (open `scenario.yaml`, the source file, the Razor page). If it does not, name the real one or say how the test creates it.
- The title matches the steps (same input, same ids, same user; a title that says "brand or type" has steps for both).
- Every precondition is one value, and no two cases that share a scenario seed the same user differently.
- Every mechanism a step needs is named: how the token is obtained (identity token endpoint with alice's credentials), how the new row is identified, how the test waits for an asynchronous effect.
- Where the story does not state a value, assert only what it states and list the rest under Open questions.

- Bad: `loadScenario('save-for-later')` when the scenario is `cart-1`; "read the order back as alice" with no token source; "any authenticated caller"; "the WebApp unit test project" that does not exist.
- Good: `loadScenario('cart-1')`; "POST the identity token endpoint with alice/Pass123$, use the access_token as Bearer"; "signed in as alice"; "tests/WebApp.UnitTests (new project, `InternalsVisibleTo` added)".

## L3: One case per distinct behavior; merge cases that repeat the same request and assertion
<!-- category: duplicate-case; subtype: ; added: 2026-11-14 -->

Before writing a case, check whether an earlier case already sends the same input class and asserts the same outcome. If it does, add only the new assertion (a side-effect check, persisted state) to that case instead of a new file. Different ids that pass through the same check (id 1, id 101, id 6001 all "exists") are one case; keep separate cases only for different branches or boundaries. Do not write two repository round-trips that check the same fields, and do not write a case whose only new content is a count already asserted elsewhere.

- Bad: TC-01 (id 1 returns 409), TC-04 (id 101 returns 409), TC-05 (id 6001 returns 409).
- Good: TC-01 asserts 409 and no new row for id 1; TC-05 covers a different branch (an id above the seeded range after the sequence moves).
