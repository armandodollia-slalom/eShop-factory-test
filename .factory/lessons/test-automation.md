# Lessons: test-automation

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-automation agent's instructions on every run.

## L2: Assert every outcome the case's expected result lists
<!-- category: missing-assertion; subtype: ; added: 2026-11-14 -->

Walk the Expected result line by line and give each item its own assertion: absence of keys or error text, the exact Location suffix, persisted state read back afterwards. `not null` and status-only checks do not cover these.

- Bad: `expect(response.Headers.Location).NotNull()`.
- Good: `Assert.EndsWith($"/api/catalog/items/{id}", location.ToString())` plus a follow-up GET or status read where the case says state is unchanged.

## L4: Follow the style of the neighbouring tests
<!-- category: pr-check-style; subtype: ; added: 2026-11-14 -->

Before committing a test: use `using` directives, never inline fully qualified type names when the namespace is already imported elsewhere; merge helpers that differ only by a parameter; use `DataRow` instead of looping scenarios in one test; treat `BASE_URL` the way the neighbouring spec does (no stray `!` or module-scope throw); reference only scenario names that exist in the repository (check `scenario.yaml`) in specs and in plan text you touch.

## L5: Copy the case's literals into the test, then tick them off before finishing
<!-- category: tests-different-path; subtype: ; added: 2026-11-14 -->

For each test, list the case's concrete values (ids, order numbers, header values, body fields, strings) and the values it compares against (original name, status read back). Write them into the test as named constants taken from the case, and re-read the case once more after the test compiles to confirm every constant is used as written.

- Bad: the case says order 6 with an empty `x-requestid` and a name equal to the original; the test sends order 5 and checks the name is not blank.
- Good: the test sends order 6 with the empty header, then reads order 6's status; it saves `originalName` before the PUT and asserts equality with it afterwards.
