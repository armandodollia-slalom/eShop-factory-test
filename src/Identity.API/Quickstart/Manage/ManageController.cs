using eShop.Identity.API.Models.ManageViewModels;

namespace IdentityServerHost.Quickstart.UI
{
    [SecurityHeaders]
    [Authorize]
    public class ManageController : Controller
    {
        private const string PasswordMismatchMessage = "The current password is incorrect.";
        private const int NewPasswordMinLength = 6;
        private const int NewPasswordMaxLength = 100;
        private const string NewPasswordLengthMessage = "The New password must be at least 6 and at max 100 characters long.";

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;

        public ManageController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult ChangePassword()
        {
            return View(new ChangePasswordViewModel());
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChangePassword(ChangePasswordViewModel model)
        {
            // Checked here rather than with [StringLength], which renders maxlength on the New password
            // input only: the browser would then cut it to 100 characters while Confirm keeps them all,
            // and the shopper would be told the entries differ instead of that the password is too long.
            if (model.NewPassword is { Length: < NewPasswordMinLength or > NewPasswordMaxLength })
            {
                ModelState.AddModelError(nameof(ChangePasswordViewModel.NewPassword), NewPasswordLengthMessage);
            }

            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return Challenge();
            }

            var result = await _userManager.ChangePasswordAsync(user, model.OldPassword, model.NewPassword);
            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    var isMismatch = error.Code == nameof(IdentityErrorDescriber.PasswordMismatch);
                    ModelState.AddModelError(string.Empty, isMismatch ? PasswordMismatchMessage : error.Description);
                }

                return View(model);
            }

            await _signInManager.RefreshSignInAsync(user);

            ViewData["ShopUrl"] = _configuration["WebAppClient"];
            return View("ChangePasswordConfirmation");
        }
    }
}
