---
id: TC-BUG-5-06
type: sad
sad-path: validation
layer: unit
covers: ["Suggested fix: single leading / not followed by /", "Code map: //host"]
priority: P0
---

# TC-BUG-5-06: ToLocalOrRoot("//evil.example") returns "/"

## Why

- Public static helper is the whole rule; unit layer is the cheapest that checks it exactly.

## Preconditions

- Unit test project for the WebApp (MSTest, no services); calls the public static method `eShop.WebApp.LocalReturnUrl.ToLocalOrRoot(string?)`.

## Steps

1. Call `LocalReturnUrl.ToLocalOrRoot("//evil.example")`.

## Expected result

- Returns the string `/`.
