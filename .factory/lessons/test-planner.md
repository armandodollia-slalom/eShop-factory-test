# Lessons: test-planner

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-planner agent's instructions on every run.

## L1: Write every precondition, step and expected result as one concrete value
<!-- category: vague-steps; subtype: ; added: 2026-11-14 -->

Name the exact user, ids, request body and expected rendering or string. Never write "or", "any", "as the app formats it" or "use an unused id". If the story leaves a value open, assert only what the story states (e.g. status 400 and a non-empty body) and list the rest under Open questions.

- Bad: `Expected: no item count badge (or 0)`; `Precondition: any authenticated caller`; `Body "id":0 ... use an unused id`.
- Good: `Expected: the cart link has no .cart-button-count element`; `Precondition: signed in as alice`; `Body {"id":0,...} (0 means server-generated)`.
