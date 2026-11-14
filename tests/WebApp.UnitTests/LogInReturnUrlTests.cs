using eShop.WebApp.Components.Pages.User;

namespace eShop.WebApp.UnitTests;

[TestClass]
[TestCategory("BUG-5")]
public class LogInReturnUrlTests
{
    private const string Home = "/";

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-06")]
    public void TC_BUG_5_06_ProtocolRelativeUrlBecomesHome()
        => Assert.AreEqual(Home, LogIn.LocalReturnUrl("//evil.example"));

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-07")]
    public void TC_BUG_5_07_SlashBackslashUrlBecomesHome()
        => Assert.AreEqual(Home, LogIn.LocalReturnUrl("/\\evil.example"));

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-08")]
    public void TC_BUG_5_08_LeadingBackslashUrlBecomesHome()
        => Assert.AreEqual(Home, LogIn.LocalReturnUrl("\\evil.example"));

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-09")]
    public void TC_BUG_5_09_AbsoluteUriBecomesHome()
        => Assert.AreEqual(Home, LogIn.LocalReturnUrl("https://evil.example/"));

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-10")]
    public void TC_BUG_5_10_LeadingWhitespaceUrlBecomesHome()
        => Assert.AreEqual(Home, LogIn.LocalReturnUrl(" //evil.example"));

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-11")]
    public void TC_BUG_5_11_EmbeddedTabUrlBecomesHome()
        => Assert.AreEqual(Home, LogIn.LocalReturnUrl("/\t/evil.example"));

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-12")]
    public void TC_BUG_5_12_NullBecomesHome()
        => Assert.AreEqual(Home, LogIn.LocalReturnUrl(null));

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-13")]
    public void TC_BUG_5_13_EmptyStringBecomesHome()
        => Assert.AreEqual(Home, LogIn.LocalReturnUrl(string.Empty));

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-14")]
    public void TC_BUG_5_14_LocalAbsolutePathIsKept()
        => Assert.AreEqual("/item/5", LogIn.LocalReturnUrl("/item/5"));

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-15")]
    public void TC_BUG_5_15_BaseRelativePathIsKept()
        => Assert.AreEqual("item/5", LogIn.LocalReturnUrl("item/5"));

    [TestMethod]
    [TestProperty("TestCase", "TC-BUG-5-16")]
    public void TC_BUG_5_16_SingleSlashIsKept()
        => Assert.AreEqual(Home, LogIn.LocalReturnUrl("/"));
}
