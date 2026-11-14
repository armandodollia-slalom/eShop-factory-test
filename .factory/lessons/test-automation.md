# Lessons: test-automation

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-automation agent's instructions on every run.

## L2: Assert every outcome the case's expected result lists
<!-- category: missing-assertion; subtype: ; added: 2026-11-14 -->

Walk the Expected result line by line and give each item its own assertion: absence of keys or error text, the exact Location suffix, persisted state read back afterwards. `not null` and status-only checks do not cover these.

- Bad: `expect(response.Headers.Location).NotNull()`.
- Good: `Assert.EndsWith($"/api/catalog/items/{id}", location.ToString())` plus a follow-up GET or status read where the case says state is unchanged.

## L4: Follow the style of the neighbouring tests
<!-- category: pr-check-style; subtype: ; added: 2026-11-14 -->

Before committing a test, open one neighbouring file in the same project and match it: `using` directives, never inline fully qualified names when the namespace is imported; no explicit `using` for namespaces `ImplicitUsings` already provides (for example `System.Threading`); private helpers go at the end of the class, after all test methods; merge helpers that differ only by a parameter; use `DataRow` instead of looping scenarios; treat `BASE_URL` the way the neighbouring spec does (no stray `!` or module-scope throw); reference only scenario names that exist in the repository (check `scenario.yaml`). Before writing an auth or token helper in a spec, look in `e2e/teststack` for an existing shared helper and reuse it; if two specs need the same block, move it into a shared helper instead of pasting it.

## L5: Copy the case's literals into the test, then tick them off before finishing
<!-- category: tests-different-path; subtype: ; added: 2026-11-14 -->

For each test, list the case's concrete values (ids, order numbers, header values, body fields, strings, the acting user) and the values it compares against (original name, status read back). Write them into the test as named constants taken from the case, and re-read the case once more after the test compiles. Do not substitute a "safer" value (a random id, a suffixed buyer id, a different order, another user's token) unless the case allows it; if isolation really needs a different value, keep the case's value for the asserted behavior (for example send `"id":0` for server-generated ids) and say the deviation in the test's comment. Act as the user the case names: an ownership or sign-in case must use that user's own token or session.

- Bad: the case says order 6 with an empty `x-requestid`; the test sends order 5. The case says `"id":0`; the test sends `"id":10017`. The case reads bob's order as bob; the test uses alice's token.
- Good: the test sends order 6 with the empty header, then reads order 6's status; it sends `"id":0`; it gets bob's token and reads order 9001 as bob.

## L6: Run data-driven cases as parameterised tests and share assertion blocks
<!-- category: other; subtype: style; added: 2026-11-14 -->

When a case lists several inputs (event names, ids, notes) write one `[Theory]`/`DataRow`/`test.describe` row per input so each failure is isolated; never loop inputs inside one `[Fact]` or one test. When two tests repeat the same flow or the same assertion block apart from a value (place order and poll, "first page" checks), extract one helper taking that value (`expectFirstPage`, `placeOrderAndRead(note)`) before committing.

## L8: Assert literals from the case, not values read back from the system under test
<!-- category: wrong-assertion; subtype: ; added: 2026-11-14 -->

Compare against the exact string, number or label the case states, never against a value fetched before the action (it passes when already mutated) or a substring/first-match locator. For labels use exact matching (`getByLabel(text, { exact: true })`); for lists locate the specific new row (by its id or unique content) before asserting its total; assert that a field equals the original literal (`"Wanderer Black Hiking Boots"`), not just that it is non-blank or unchanged from a read taken in the same test.

## L9: Make every feature video show what the case asserts
<!-- category: pr-check-video; subtype: ; added: 2026-11-14 -->

The PR check reads frames. For each UI case: sign in visibly (or show a signed-in marker in the frame) when the case depends on the session; show the click on the element and then the destination's title or URL; for absence checks scroll to or frame the area where the element would appear before `demo.absent`, not the page top; after an action that should create nothing, navigate to the list or read the API and show the unchanged result; scroll the final asserted text into view (empty-cart message, totals) and use a full-width viewport so the closing frame is readable; make off-site or hostile-URL cases show the input in a frame (for example a visible URL or label).
