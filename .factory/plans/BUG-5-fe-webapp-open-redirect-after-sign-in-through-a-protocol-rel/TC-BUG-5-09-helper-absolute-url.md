---
id: TC-BUG-5-09
type: sad
sad-path: validation
layer: unit
covers: ["Code map: https://host -> /"]
priority: P1
---

# TC-BUG-5-09: ToLocalOrRoot("https://evil.example/") returns "/"

## Why

- Public static helper is the whole rule; unit layer is the cheapest that checks it exactly.

## Preconditions

- Unit test project for the WebApp (MSTest, no services); calls the public static method `eShop.WebApp.ReturnUrl.ToLocalOrRoot(string?)`.

## Steps

1. Call `ReturnUrl.ToLocalOrRoot("https://evil.example/")`.

## Expected result

- Returns the string `/`.
