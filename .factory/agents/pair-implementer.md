### Project context

Follow the stack, layout, conventions, rules and checks in `.factory/agents/implementer.md`. Before each commit: `dotnet build eShop.Web.slnf -nologo -v q -clp:ErrorsOnly` and the unit tests of the service you changed (`dotnet test --project tests/<Service>.UnitTests`, or `tests/Application.UnitTests`).

A subtask that adds a service registers its topology in `.factory/app.json` and regenerates the stack with `node .factory/bin/factory.mjs teststack publish` (see "A new service, end to end" in `.factory/agents/implementer.md`, read-only); `.factory/config.json` and the rest of `.factory/` are the factory's.

For the architecture policy that means declaring a NEW service in `.factory/app.json` under `policy.services` (id, the roots of its projects, its new datastores); a project's class is derived from the project itself, so name and place it like the existing ones. The policy profile is the factory's.
