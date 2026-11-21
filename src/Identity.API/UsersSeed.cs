
namespace eShop.Identity.API;

public class UsersSeed(ILogger<UsersSeed> logger, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager) : IDbSeeder<ApplicationDbContext>
{
    /// <summary>Role that may change the catalog (Catalog.API's write policy requires it).</summary>
    public const string AdminRole = "Admin";

    public async Task SeedAsync(ApplicationDbContext context)
    {
        if (!await roleManager.RoleExistsAsync(AdminRole))
        {
            var roleResult = await roleManager.CreateAsync(new IdentityRole(AdminRole));

            if (!roleResult.Succeeded)
            {
                throw new Exception(roleResult.Errors.First().Description);
            }
        }

        var admin = await userManager.FindByNameAsync("admin");

        if (admin == null)
        {
            admin = new ApplicationUser
            {
                UserName = "admin",
                Email = "admin@email.com",
                EmailConfirmed = true,
                CardHolderName = "Catalog Admin",
                CardNumber = "XXXXXXXXXXXX1881",
                CardType = 1,
                City = "Redmond",
                Country = "U.S.",
                Expiration = "12/24",
                Id = Guid.NewGuid().ToString(),
                LastName = "Admin",
                Name = "Catalog",
                PhoneNumber = "1234567890",
                ZipCode = "98052",
                State = "WA",
                Street = "15703 NE 61st Ct",
                SecurityNumber = "789"
            };

            var result = await userManager.CreateAsync(admin, "Pass123$");

            if (!result.Succeeded)
            {
                throw new Exception(result.Errors.First().Description);
            }

            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("admin created");
            }
        }

        if (!await userManager.IsInRoleAsync(admin, AdminRole))
        {
            var result = await userManager.AddToRoleAsync(admin, AdminRole);

            if (!result.Succeeded)
            {
                throw new Exception(result.Errors.First().Description);
            }
        }

        var alice = await userManager.FindByNameAsync("alice");

        if (alice == null)
        {
            alice = new ApplicationUser
            {
                UserName = "alice",
                Email = "AliceSmith@email.com",
                EmailConfirmed = true,
                CardHolderName = "Alice Smith",
                CardNumber = "XXXXXXXXXXXX1881",
                CardType = 1,
                City = "Redmond",
                Country = "U.S.",
                Expiration = "12/24",
                Id = Guid.NewGuid().ToString(),
                LastName = "Smith",
                Name = "Alice",
                PhoneNumber = "1234567890",
                ZipCode = "98052",
                State = "WA",
                Street = "15703 NE 61st Ct",
                SecurityNumber = "123"
            };

            var result = await userManager.CreateAsync(alice, "Pass123$");

            if (!result.Succeeded)
            {
                throw new Exception(result.Errors.First().Description);
            }

            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("alice created");
            }
        }
        else
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("alice already exists");
            }
        }

        var bob = await userManager.FindByNameAsync("bob");

        if (bob == null)
        {
            bob = new ApplicationUser
            {
                UserName = "bob",
                Email = "BobSmith@email.com",
                EmailConfirmed = true,
                CardHolderName = "Bob Smith",
                CardNumber = "XXXXXXXXXXXX1881",
                CardType = 1,
                City = "Redmond",
                Country = "U.S.",
                Expiration = "12/24",
                Id = Guid.NewGuid().ToString(),
                LastName = "Smith",
                Name = "Bob",
                PhoneNumber = "1234567890",
                ZipCode = "98052",
                State = "WA",
                Street = "15703 NE 61st Ct",
                SecurityNumber = "456"
            };

            var result = await userManager.CreateAsync(bob, "Pass123$");

            if (!result.Succeeded)
            {
                throw new Exception(result.Errors.First().Description);
            }

            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("bob created");
            }
        }
        else
        {
            if (logger.IsEnabled(LogLevel.Debug))
            {
                logger.LogDebug("bob already exists");
            }
        }
    }
}
