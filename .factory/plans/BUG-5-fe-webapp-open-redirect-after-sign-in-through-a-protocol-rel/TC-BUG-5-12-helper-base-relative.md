---
id: TC-BUG-5-12
type: happy
layer: unit
covers: ["Decisions: item/5 becomes /item/5"]
priority: P1
---

# TC-BUG-5-12: ToLocalOrRoot makes a base-relative path root-relative

## Why

- Public static helper is the whole rule; unit layer is the cheapest that checks it exactly.

## Preconditions

- Unit test project for the WebApp (MSTest, no services); calls the public static method `eShop.WebApp.ReturnUrl.ToLocalOrRoot(string?)`.

## Steps

1. Call `ReturnUrl.ToLocalOrRoot("item/5")`.

## Expected result

- Returns the string `/item/5`.
