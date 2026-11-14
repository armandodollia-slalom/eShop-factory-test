---
id: TC-BUG-5-08
type: sad
sad-path: validation
layer: unit
covers: ["Decisions: non-backslash-prefixed", "Code map: off-site -> /"]
priority: P1
---

# TC-BUG-5-08: ToLocalOrRoot("\evil.example") returns "/"

## Why

- A leading backslash is not made root-relative by the base-relative rule; the story's decision explicitly excludes it.

## Preconditions

- Unit test project for the WebApp (MSTest, no services); calls the public static method `eShop.WebApp.ReturnUrl.ToLocalOrRoot(string?)`.

## Steps

1. Call `ReturnUrl.ToLocalOrRoot("\evil.example")` (backslash, evil.example).

## Expected result

- Returns the string `/`.
