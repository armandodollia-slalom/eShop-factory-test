### Project context

Frameworks, story tags and commands are in `.factory/agents/test-automation.md`. A functional test must assert the status code and the body the case expects (e.g. a `ProblemDetails` 400), not only that the call returned; an e2e test must sign in as a seeded user and assert what the user sees.
