---
id: TC-PRB-8-06
type: happy
layer: e2e
covers: ["AC3: the copyright line is unchanged", "AC3: the legal links are unchanged"]
priority: P2
---

# TC-PRB-8-06: Copyright line and Privacy, Terms, Cookies legal links are unchanged

## Why

- The new link is inserted into the same list as the legal links (Implementation Notes), so the legal links and the copyright line beside them are the most likely to be disturbed. AC3 requires them unchanged.

## Preconditions

- Test stack running with scenario `default`; anonymous shopper.

## Steps

1. Open `/`.
2. In `.eshop-footer-bottom`, read the copyright paragraph and the first three items of the `Legal` list.

## Expected result

- The copyright paragraph's text is exactly `© <current year> AdventureWorks. All rights reserved.` (current year: the test machine's year, 2026 at the time of writing).
- The `Legal` list's first three items are links named `Privacy`, `Terms`, `Cookies`, in that order, and none of them has an `href` attribute.
- The copyright paragraph and the `Legal` list are both still direct parts of `.eshop-footer-bottom`.
