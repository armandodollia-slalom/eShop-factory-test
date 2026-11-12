# Test stack

The AI app factory runs this application on a scenario-seeded Docker stack: `factory teststack up`, then
`npx playwright test -c playwright.teststack.config.ts`. See `.factory/config.json` (`stack`, `teststack`).
