### Project context

The conventions a change must follow are in `.factory/agents/implementer.md` (endpoint shape, central package versions, versioned APIs, no cross-service references). Build: `dotnet build eShop.Web.slnf -nologo -v q -clp:ErrorsOnly`. A change to Catalog.API endpoints must come with the regenerated `src/Catalog.API/Catalog.API*.json`.
