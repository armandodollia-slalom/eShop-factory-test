# Lessons: test-automation

Rules learned from this repository's reviews, verifier findings and PR checks; they are appended to the test-automation agent's instructions on every run.

## L2: Assert every outcome the case's expected result lists
<!-- category: missing-assertion; subtype: ; added: 2026-11-14 -->

Walk the Expected result line by line and give each item its own assertion: absence of keys or error text, the exact Location suffix, persisted state read back afterwards. `not null` and status-only checks do not cover these.

- Bad: `expect(response.Headers.Location).NotNull()`.
- Good: `Assert.EndsWith($"/api/catalog/items/{id}", location.ToString())` plus a follow-up GET or status read where the case says state is unchanged.

## L5: Run each case's steps as the identity and in the order the case gives
<!-- category: tests-different-path; subtype: ; added: 2026-11-15 -->

List the case's concrete values (ids, order numbers, header values, body fields, strings) and **who** makes each request. Write them as named constants taken from the case and re-read the case after the test compiles to confirm each is used as written. Each request uses the identity the case names (the owner reads as the owner, not with another user's token); a "sign out, sign in as X" step signs out in the same browser context. When isolation seems to need a different value (a GUID-suffixed buyer id), keep the case's value and isolate another way (clear that user's data first).

- Bad: the case reads order 9001 as bob, its owner; the test only gets alice's token and passes because the endpoint does not check ownership.
- Good: the test obtains bob's token and reads 9001 as bob; it sends order 6 with the empty header the case gives and saves `originalName` before the PUT to compare afterwards.

## L6: Keep comments true to the code and the case, and use one BASE_URL convention
<!-- category: other; subtype: style; added: 2026-11-15 -->

A comment describes what the test does now. Before finishing, re-read every comment that mentions the case, the plan or a deviation and delete it if the test now matches the case. Navigate the way the neighbouring specs do (`page.goto(BASE_URL)` / `` `${BASE_URL}/path` `` from `./ports`) in every helper and test of the file, never mixing it with `page.goto('/')`.

- Bad: `// The case names Blizzard Rider as the first card; assert the real order` above assertions that already follow the corrected case.
- Good: no comment, or one that states only why the code is written that way.

## L7: Make each video prove its case without the test code
<!-- category: pr-check-video; subtype: ; added: 2026-11-15 -->

The recording has no address bar and no mouse pointer, so whatever identifies the case must be on screen. Narrate with `demo.caption` the requested URL and the URL after a navigation or redirect (`page.url()` read at run time), the input that makes the case different (order number `999999`, `?city=red`), and any value only a measurement shows (the computed `cursor` style). Bring every element the case's step depends on into view (the pager, the last card of page 1 before going to page 2). Keep captions short enough to fit the viewport; split a long one in two.

- Bad: video for `/user/orders/999999` shows only "Order not found (HTTP 404)".
- Good: `await demo.caption(`Opened ${page.url()} -> Order not found (HTTP 404)`)`.

## L9: Anchor highlight and absent frames on the region the claim is about
<!-- category: visual-mismatch; subtype: ; added: 2026-11-15 -->

`demo.absent` and `demo.highlight` scroll their locator into view, so pass the element where the thing would appear, not one elsewhere on the page. For "no saved section below the cart" anchor on the cart's bottom or the container under it; for "no pager below the nine cards" anchor on the card list's last row; for "checkbox still checked" highlight the checkbox itself. When a claim spans more than the viewport (all nine cards), take one frame per part so every position the label names is visible.

- Bad: `await demo.absent(page.locator('.cart-summary'), 'no Saved for later section')` while the section's place is off-screen below.
- Good: `await demo.absent(page.locator('.cart-items').last(), 'no Saved for later section below the cart')`.

## L10: Assert exact equality when the case says exact
<!-- category: wrong-assertion; subtype: ; added: 2026-11-15 -->

Locators and collection checks match loosely by default. When the case gives an exact label, set or value, assert exactly that:

- Labels: `getByLabel` is a case-insensitive substring match; use `getByLabel('Delivery note (optional)', { exact: true })` and assert the label text.
- Sets: assert equivalence (`CollectionAssert.AreEquivalent(new[] {"basket","catalog","orders","webhooks"}, scopes)`), not `Contains` of one member.
- New records: locate the record the test created (by its id or a unique value) before asserting its total; never `.first()` of a list that older records also match.
