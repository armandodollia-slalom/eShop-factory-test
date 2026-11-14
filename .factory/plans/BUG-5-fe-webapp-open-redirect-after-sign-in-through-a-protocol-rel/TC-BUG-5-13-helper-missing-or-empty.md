---
id: TC-BUG-5-13
type: sad
sad-path: boundary
layer: unit
covers: ["Code map: missing or empty return URL -> /"]
priority: P1
---

# TC-BUG-5-13: ToLocalOrRoot with null or empty input returns "/"

## Why

- Missing returnUrl is the normal case when a user signs in without a target; null and empty are the two boundary inputs.

## Preconditions

- Unit test project for the WebApp (MSTest, no services); calls the public static method `eShop.WebApp.LocalReturnUrl.ToLocalOrRoot(string?)`.

## Steps

1. Call `LocalReturnUrl.ToLocalOrRoot(null)`.
2. Call `LocalReturnUrl.ToLocalOrRoot("")`.

## Expected result

- Step 1 returns the string `/`.
- Step 2 returns the string `/`.
