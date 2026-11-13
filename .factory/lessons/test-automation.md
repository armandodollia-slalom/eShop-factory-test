## L1: Use exactly the inputs the case specifies
<!-- category: tests-different-path; subtype: ; added: 2026-11-13 -->

Copy the case's order number, event string, ids and request bodies verbatim into the test. Do not substitute a "similar" value, add fields (such as an `id`), or change a repeated request. If the value is unusable, fix the case's scenario, not the input.

- Bad: case says order 6 and event `"99999999999"`; test sends order 5 and `"2147483648"`.
- Good: the test sends order 6 and `"99999999999"` and asserts on order 6.

## L2: Assert every expected result the case lists, including state afterwards
<!-- category: missing-assertion; subtype: ; added: 2026-11-13 -->

Walk the case's Expected result line by line and map each clause to an assertion. "Still Paid", "no Postgres error shown" and "errors has no Url key" each need their own check (read the state back, inspect the body, assert the key is absent).

- Bad: `expect(res.status()).toBe(409);` when the case also requires no database error text.
- Good: also `expect(await res.text()).not.toMatch(/duplicate key|violates|postgres/i);`

## L3: Keep test code consistent with the repo's conventions
<!-- category: pr-check-style; subtype: ; added: 2026-11-13 -->

Before finishing, check test code for: fully qualified type names where a `using` is possible, duplicated helpers that differ by one argument (parameterize them), `foreach` over scenarios instead of `DataRow`/`test.each`, inconsistent `!` assertions on nullable config such as `BASE_URL` (follow the neighbouring spec), and comments or plans naming a scenario that does not exist (use the real scenario name).

- Bad: `eShop.EventBus.Events.IntegrationEvent` inline three times; `page.goto(BASE_URL!)` while the sibling spec uses `page.goto(BASE_URL)`.
- Good: a `using` directive; the same BASE_URL handling as the sibling spec.
