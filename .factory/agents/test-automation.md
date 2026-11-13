### Layout

Product code (`src/`) is never changed by this agent. Scenarios: `.factory/stack/scenarios/<name>/scenario.yaml` (format: `docs/test-stack.md` in the factory install, `factory version --path`).

A new test project is registered in `tests/` and `eShop.Web.slnf` like the existing ones, and is classified as a test by the architecture policy because it lives under `tests/` and is a test project (MSTest.Sdk or an xunit package), like the existing ones; without that the policy blocks it as unclassified (ARCH-001).

### Test framework per layer

- `unit`: MSTest (MSTest.Sdk) in `tests/<Service>.UnitTests/<Story>Tests.cs`; copy `tests/Basket.UnitTests/BasketServiceTests.cs`. Services without their own project use `tests/Application.UnitTests`.
- `functional`: xUnit v3 in `tests/<Service>.FunctionalTests/<Story>Tests.cs`, using the existing fixture (`tests/Catalog.FunctionalTests/CatalogApiFixture.cs`, `IClassFixture<CatalogApiFixture>`); copy `CatalogApiTests.cs`.
- `e2e`: Playwright in `e2e/teststack/<story-key-lowercase>.spec.ts`. Import `test` and `expect` from `../demo` (or `../fixtures`), load the scenario in `beforeAll` with `loadScenario('<name>')` from `./scenario`, build URLs with `BASE_URL`/`url()` from `./ports`. Sign in like `e2e/login.setup.ts` (alice / `Pass123$`).

### Story tag

- MSTest: class `[TestCategory("<KEY>")]`, each test `[TestProperty("TestCase", "TC-<KEY>-NN")]` and a method name starting with the case id, underscores for dashes: `TC_ABC_12_03_GuestSeesSignInLink`.
- xUnit: class `[Trait("Story", "<KEY>")]`, each test `[Trait("TestCase", "TC-<KEY>-NN")]`, same method naming.
- Playwright: the test title starts with the case id: `test('TC-<KEY>-NN shopper ...', ...)`.

### Commands

- Build one test project: `dotnet build tests/<Project> --nologo -v quiet`
- MSTest: `dotnet test --project tests/<Project> --no-build --filter TestCategory=<KEY>`
- xUnit: `dotnet test --project tests/<Project> --no-build -- --filter-trait Story=<KEY>`
- e2e: `factory teststack up`, then `E2E_KEEP_VIDEOS=1 npx playwright test -c playwright.teststack.config.ts --grep TC-<KEY>- e2e/teststack/<file>`
- Exit code 8 from `dotnet test` means no test matched the filter. Package versions go in `Directory.Packages.props`.

### Evidence

Playwright videos, keyframes and `artifacts/e2e-videos/manifest.json` are written by `e2e/video-reporter.ts`; wrap steps in `test.step` or use the `demo` fixture so each step gets a keyframe.
