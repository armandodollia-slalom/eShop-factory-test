# Lessons: test-automation

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-automation agent's instructions on every run.

## L1: Send exactly the input the case specifies
<!-- category: tests-different-path; subtype: ; added: 2026-11-14 -->

Use the case's ids, order numbers, strings and body fields verbatim. Do not add fields (a shared helper that injects an `id`), swap values (another order, another name, a smaller number) or change a repeated request. If a helper alters the input, build the case's body directly instead.

- Bad: case says order 6 with an empty `x-requestid`; test sends order 5.
- Good: the test sends order 6 with the empty header and then asserts order 6's status.

## L2: Assert every outcome the case's expected result lists
<!-- category: missing-assertion; subtype: ; added: 2026-11-14 -->

Walk the Expected result line by line and give each item its own assertion: absence of keys or error text, the exact Location suffix, persisted state read back afterwards. `not null` and status-only checks do not cover these.

- Bad: `expect(response.Headers.Location).NotNull()`.
- Good: `Assert.EndsWith($"/api/catalog/items/{id}", location.ToString())` plus a follow-up GET or status read where the case says state is unchanged.

## L3: Make assertions strict enough to fail on the wrong behavior
<!-- category: wrong-assertion; subtype: ; added: 2026-11-14 -->

Compare against the exact expected value, not a weaker property. Capture the original value before the action and compare to it afterwards; assert absence with a count of 0 on a filtered locator, not a negated array match.

- Bad: name after PUT `is not blank`; `not.toContainText(['Bravo Pack'])` on a multi-element locator.
- Good: `Assert.Equal(originalName, nameAfter)`; `expect(cards.filter({ hasText: 'Bravo Pack' })).toHaveCount(0)`.

## L4: Follow the style of the neighbouring tests
<!-- category: pr-check-style; subtype: ; added: 2026-11-14 -->

Before committing a test: use `using` directives, never inline fully qualified type names when the namespace is already imported elsewhere; merge helpers that differ only by a parameter; use `DataRow` instead of looping scenarios in one test; treat `BASE_URL` the way the neighbouring spec does (no stray `!` or module-scope throw); reference only scenario names that exist in the repository (check `scenario.yaml`) in specs and in plan text you touch.
