### Project context

Follow the stack, layout, conventions, rules and checks in `.factory/agents/implementer.md`. Before each commit: `dotnet build eShop.Web.slnf -nologo -v q -clp:ErrorsOnly` and the unit tests of the service you changed (`dotnet test --project tests/<Service>.UnitTests`, or `tests/Application.UnitTests`).
