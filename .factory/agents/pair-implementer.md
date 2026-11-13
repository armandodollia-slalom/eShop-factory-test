### Project context

Follow the stack, layout, conventions, rules and checks in `.factory/agents/implementer.md`. Before each commit: `dotnet build eShop.Web.slnf -nologo -v q -clp:ErrorsOnly` and the unit tests of the service you changed (`dotnet test --project tests/<Service>.UnitTests`, or `tests/Application.UnitTests`).

A subtask that adds a service registers its topology in `.factory/app.json` and regenerates the stack with `node .factory/bin/factory.mjs teststack publish` (the "A new service, end to end" section of `.factory/agents/implementer.md`); `.factory/config.json` and the rest of `.factory/` are the factory's.
