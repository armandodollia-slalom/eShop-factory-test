---
id: TC-ACCT-1-03
type: happy
layer: e2e
covers: ["AC2: page heading \"My account\"", "AC2: tab title \"My account | AdventureWorks\""]
priority: P2
---

# TC-ACCT-1-03: Account page heading is "My account" and tab title is "My account | AdventureWorks"

## Why

- AC2 states the exact heading and browser tab title, matching the `<page> | AdventureWorks` convention of `/user/orders`. Only the rendered page shows the document title, so e2e.

## Preconditions

- Scenario `default`; `alice` signed in on the WebApp.

## Steps

1. Navigate directly to `/user/account` on the WebApp.

## Expected result

- The page has a heading with exact text "My account".
- `document.title` is exactly `My account | AdventureWorks`.
