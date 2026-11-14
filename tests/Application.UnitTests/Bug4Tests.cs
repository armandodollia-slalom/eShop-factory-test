using eShop.Identity.API.Configuration;

namespace eShop.Application.UnitTests;

// BUG-4: Identity.API defines the catalog API resource and scope that Catalog.API's JWT configuration refers to.
[TestClass]
[TestCategory("BUG-4")]
public class Bug4Tests
{
    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-4-11")]
    public void TC_BUG_4_11_IdentityDefinesCatalogApiResourceAndScope()
    {
        var scopes = Config.GetApiScopes().Select(scope => scope.Name).ToArray();
        var resources = Config.GetApis().Select(resource => resource.Name).ToArray();

        CollectionAssert.Contains(scopes, "catalog");
        CollectionAssert.Contains(resources, "catalog");
    }
}
