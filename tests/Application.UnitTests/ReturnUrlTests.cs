using eShop.WebApp;

namespace eShop.Application.UnitTests;

[TestClass]
[TestCategory("BUG-5")]
public class ReturnUrlTests
{
    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-06")]
    public void TC_BUG_5_06_ProtocolRelativeUrlReturnsRoot()
    {
        Assert.AreEqual("/", ReturnUrl.ToLocalOrRoot("//evil.example"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-07")]
    public void TC_BUG_5_07_SlashBackslashUrlReturnsRoot()
    {
        Assert.AreEqual("/", ReturnUrl.ToLocalOrRoot("/\\evil.example"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-08")]
    public void TC_BUG_5_08_LeadingBackslashUrlReturnsRoot()
    {
        Assert.AreEqual("/", ReturnUrl.ToLocalOrRoot("\\evil.example"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-09")]
    public void TC_BUG_5_09_AbsoluteUrlReturnsRoot()
    {
        Assert.AreEqual("/", ReturnUrl.ToLocalOrRoot("https://evil.example/"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-10")]
    public void TC_BUG_5_10_ControlCharactersReturnRoot()
    {
        Assert.AreEqual("/", ReturnUrl.ToLocalOrRoot("/\t/evil.example"));
        Assert.AreEqual("/", ReturnUrl.ToLocalOrRoot("/item/5\n"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-11")]
    public void TC_BUG_5_11_LocalPathsAreKept()
    {
        Assert.AreEqual("/user/orders", ReturnUrl.ToLocalOrRoot("/user/orders"));
        Assert.AreEqual("/", ReturnUrl.ToLocalOrRoot("/"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-12")]
    public void TC_BUG_5_12_BaseRelativePathBecomesRootRelative()
    {
        Assert.AreEqual("/item/5", ReturnUrl.ToLocalOrRoot("item/5"));
    }

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-13")]
    public void TC_BUG_5_13_NullOrEmptyReturnsRoot()
    {
        Assert.AreEqual("/", ReturnUrl.ToLocalOrRoot(null));
        Assert.AreEqual("/", ReturnUrl.ToLocalOrRoot(""));
    }
}
