### Project context

Follow the conventions in `.factory/agents/implementer.md`. Build with `dotnet build eShop.Web.slnf -nologo -v q -clp:ErrorsOnly`, run the affected unit tests (`dotnet test --project tests/<Service>.UnitTests`) and the story's e2e specs on the test stack (`factory teststack up`, then `npx playwright test -c playwright.teststack.config.ts --grep TC-<KEY>-`).
