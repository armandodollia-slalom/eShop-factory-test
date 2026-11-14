using eShop.WebApp;

namespace eShop.Application.UnitTests;

[TestClass]
[TestCategory("BUG-5")]
public class LocalReturnUrlTests
{
    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-06")]
    public void TC_BUG_5_06_ProtocolRelativeUrlReturnsRoot()
    {
        Assert.AreEqual("/", LocalReturnUrl.ToLocalOrRoot("//evil.example"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-07")]
    public void TC_BUG_5_07_SlashBackslashUrlReturnsRoot()
    {
        Assert.AreEqual("/", LocalReturnUrl.ToLocalOrRoot("/\\evil.example"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-08")]
    public void TC_BUG_5_08_LeadingBackslashUrlReturnsRoot()
    {
        Assert.AreEqual("/", LocalReturnUrl.ToLocalOrRoot("\\evil.example"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-09")]
    public void TC_BUG_5_09_AbsoluteUrlReturnsRoot()
    {
        Assert.AreEqual("/", LocalReturnUrl.ToLocalOrRoot("https://evil.example/"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-10")]
    public void TC_BUG_5_10_ControlCharactersReturnRoot()
    {
        Assert.AreEqual("/", LocalReturnUrl.ToLocalOrRoot("/\t/evil.example"));
        Assert.AreEqual("/", LocalReturnUrl.ToLocalOrRoot("/item/5\n"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-11")]
    public void TC_BUG_5_11_LocalPathsAreKept()
    {
        Assert.AreEqual("/user/orders", LocalReturnUrl.ToLocalOrRoot("/user/orders"));
        Assert.AreEqual("/", LocalReturnUrl.ToLocalOrRoot("/"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-12")]
    public void TC_BUG_5_12_BaseRelativePathBecomesRootRelative()
    {
        Assert.AreEqual("/item/5", LocalReturnUrl.ToLocalOrRoot("item/5"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-13")]
    public void TC_BUG_5_13_NullOrEmptyReturnsRoot()
    {
        Assert.AreEqual("/", LocalReturnUrl.ToLocalOrRoot(null));
        Assert.AreEqual("/", LocalReturnUrl.ToLocalOrRoot(""));
    }
}
