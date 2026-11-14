---
id: TC-BUG-5-07
type: sad
sad-path: validation
layer: unit
covers: ["Suggested fix: not followed by \\", "Code map: /\\host"]
priority: P1
---

# TC-BUG-5-07: ToLocalOrRoot("/\evil.example") returns "/"

## Why

- Public static helper is the whole rule; unit layer is the cheapest that checks it exactly.

## Preconditions

- Unit test project for the WebApp (MSTest, no services); calls the public static method `eShop.WebApp.ReturnUrl.ToLocalOrRoot(string?)`.

## Steps

1. Call `ReturnUrl.ToLocalOrRoot("/\evil.example")` (the string is slash, backslash, evil.example).

## Expected result

- Returns the string `/`.
