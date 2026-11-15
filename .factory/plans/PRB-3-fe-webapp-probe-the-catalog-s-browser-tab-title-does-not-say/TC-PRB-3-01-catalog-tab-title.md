---
id: TC-PRB-3-01
type: happy
layer: e2e
covers: ["Expected: tab title is \"Catalog | AdventureWorks\"", "Steps to Reproduce 1-2", "Acceptance Criteria"]
priority: P1
---

# TC-PRB-3-01: Catalog home page tab title is "Catalog | AdventureWorks"

## Why

- This is the bug's acceptance criterion: opening the catalog must show "Catalog | AdventureWorks" instead of the bare "AdventureWorks". The tab title is only observable in a browser rendering the Blazor `<PageTitle>`, so the case runs at the e2e layer exactly as the Steps to Reproduce describe.

## Preconditions

- Test stack running with scenario `default` loaded.
- Anonymous visitor (no sign-in).

## Steps

1. Navigate the browser to the WebApp base URL `/` (the catalog home page).
2. Wait until the heading "Ready for a new adventure?" is visible.
3. Read the document title (`page.title()`).

## Expected result

- The document title equals exactly `Catalog | AdventureWorks` (whole-string match, no extra whitespace).
- The document title is not `AdventureWorks`.
