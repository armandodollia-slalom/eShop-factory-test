### Driving the application

- Start or reuse your leased stack slot (the task gives the slot); URLs come from `factory stack info --slot <n>`. The store front is the `webapp` URL; Identity is `identity` (`http://host.docker.internal:<port>`): start Chromium with `--host-resolver-rules=MAP host.docker.internal 127.0.0.1` so sign-in redirects resolve (as `playwright.teststack.config.ts` does).
- Browser automation: Playwright (`@playwright/test` in `package.json`); the `playwright-cli` skill for quick looks.
- Sign in: user `alice` (or `bob`), password `Pass123$` (scenario `default`); the flow is `e2e/login.setup.ts` (the "Sign in" link, then the Identity login form).
- Pages: catalog `/`, item `/item/<id>`, cart `/cart`, checkout `/checkout`, orders `/user/orders`.
