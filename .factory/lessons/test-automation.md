# Lessons: test-automation

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-automation agent's instructions on every run.

## L2: Assert every outcome the case's expected result lists
<!-- category: missing-assertion; subtype: ; added: 2026-11-14 -->

Walk the Expected result line by line and give each item its own assertion: absence of keys or error text, the exact Location suffix, persisted state read back afterwards. `not null` and status-only checks do not cover these.

- Bad: `expect(response.Headers.Location).NotNull()`.
- Good: `Assert.EndsWith($"/api/catalog/items/{id}", location.ToString())` plus a follow-up GET or status read where the case says state is unchanged.

## L4: Follow the style of the neighbouring tests
<!-- category: pr-check-style; subtype: ; added: 2026-11-14 -->

Before committing a test: use `using` directives, never inline fully qualified type names when the namespace is already imported; do not add usings that implicit usings already provide (`System.Threading`, `System.Linq`) and open a neighbouring file to compare; put private helpers at the end of the class like the neighbouring files do; keep a comment out of the gap between attributes and the method signature; merge helpers that differ only by a parameter; use `DataRow` instead of looping scenarios in one test; extract a block that already exists in a sibling spec into a shared helper; treat `BASE_URL` the way the neighbouring spec does (no stray `!` or module-scope throw); reference only scenario names that exist in the repository (check `scenario.yaml`) in specs and in plan text you touch.

## L5: Copy the case's literals into the test, then tick them off before finishing
<!-- category: tests-different-path; subtype: ; added: 2026-11-14 -->

For each test, list the case's concrete values (ids, order numbers, header values, body fields, user, strings) and the values it compares against (original name, status read back). Write them into the test as named constants taken from the case, and re-read the case once more after the test compiles to confirm every constant is used as written. Do not substitute a "safer" value (a random id, a guid-suffixed user, a different order, another user's token) even when it isolates the test; if the case's value collides with shared state, reset the state, and report the deviation. Act as the user the case names: read bob's order with bob's token, not alice's.

- Bad: the case says order 6 with an empty `x-requestid` and a name equal to the original; the test sends order 5. Or the case says body `"id":0` and the test sends `"id":10017`. Or the case reads order 9001 as bob and the test uses alice's token.
- Good: the test sends order 6 with the empty header, then reads order 6's status; it sends `"id":0`; it obtains bob's token and reads 9001 with it.

## L6: Keep test code DRY and in the neighbours' shape
<!-- category: other; subtype: style; added: 2026-11-14 -->

Before finishing, scan the new spec and test files for the patterns the verifier keeps flagging: two tests that differ only in a value (merge into one helper such as `expectFirstPage(page)` or `placeOrderAndRead(note, expected)`, or use `[Theory]`/`DataRow` rows); a block copied from a sibling spec (token acquisition, sign-in) that belongs in a shared helper in `e2e/`; a loop over event names, ids or scenarios inside one `[Fact]`; inline `import('@playwright/test').Browser` types where a named import works.

- Bad: `foreach (var name in new[]{"1","2","3"}) { ... }` inside one `[Fact]`.
- Good: `[Theory] [InlineData("1")] [InlineData("2")] [InlineData("3")]`.

## L8: Assert the literal the case states, not a value read earlier or a loose match
<!-- category: wrong-assertion; subtype: ; added: 2026-11-14 -->

When the case gives a literal (original name, total, label text), compare to that literal or to a constant copied from the case, not to a value you read just before the action and not to a non-blank check. For UI text use an exact match (`getByLabel(text, { exact: true })`, `toHaveText`). When a list may already hold a matching row, identify the new row (by order number, by position after the action) before asserting its content, and highlight that same row.

- Bad: `expect(nameAfter).toBe(nameBefore)` when the case says "Wanderer Black Hiking Boots"; `.order-total` any contains `$90.00`.
- Good: `Assert.Equal("Wanderer Black Hiking Boots", item.Name)`; locate the order row with the new order number, then assert its total is `$90.00`.

## L9: Make every video frame show the evidence
<!-- category: pr-check-video; subtype: ; added: 2026-11-14 -->

The recorded video is judged on what a viewer sees. For each UI case: sign in visibly before a signed-in check and keep a marker of it in frame; show the click and the destination (title or URL); scroll the area where an absent element would be into view before `demo.absent`; for "nothing created" show the orders page or read-back after the rejection; scroll the asserted message or total into view before the final frame; and use a viewport where full-page frames render at full width.

- Bad: `demo.absent` on the page heading while the "More from" area is below the fold.
- Good: `await section.scrollIntoViewIfNeeded()` on the container, then `demo.absent` framed on it.
