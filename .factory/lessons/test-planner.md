## L1: Make every precondition, input and expected result single-valued and concrete
<!-- category: vague-steps; subtype: ; added: 2026-11-13 -->

Two engineers reading a case must write the same test. Name the exact user, id, request body and expected string or rendering. Never write "or", "as the app formats it", "any authenticated caller", "the validator's message" or an instruction that contradicts the body shown.

- Bad: `Expected: no item count badge (or 0)`; `Caller: any authenticated user`; `body {"id":0}` plus "use an unused id".
- Good: `Expected: the cart link has no .cart-button-count element`; `Caller: alice`; `body {"id":0}` (id 0 means generate). If the exact text is not in the story, assert only status and a non-empty string body.
