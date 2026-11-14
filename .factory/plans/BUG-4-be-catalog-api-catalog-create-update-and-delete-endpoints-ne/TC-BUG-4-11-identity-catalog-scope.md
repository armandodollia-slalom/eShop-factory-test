---
id: TC-BUG-4-11
type: happy
layer: unit
covers: ["Technical Notes: Identity.API has no catalog API scope"]
priority: P2
---

# TC-BUG-4-11: Identity.API defines the catalog API resource and scope

## Why

- The Technical Notes name the missing `catalog` API scope as part of the defect; Catalog.API's `Identity:Scopes` and `Audience` refer to it. It is a pure configuration fact, so the in-process unit layer (`tests/Application.UnitTests/IdentityConfigurationTests.cs`) is the cheapest check.

## Preconditions

- None (static configuration in `src/Identity.API/Configuration/Config.cs`).

## Steps

1. Call `Config.GetApiScopes()` and collect the `Name` values.
2. Call `Config.GetApis()` and collect the `Name` values.

## Expected result

- Step 1 contains exactly `basket`, `catalog`, `orders`, `webhooks`.
- Step 2 contains `catalog`.
