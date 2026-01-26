/**
 * Page Object for Login Page
 * File: client/src/pages/LoginPage.jsx
 */
import { BASE_URL, PATHS, SELECTORS, TIMEOUTS } from '../config/constants';

export class LoginPage {
  constructor(page) {
    this.page = page;
    // Selectors based on AuthForm component
    this.emailInput = page.locator(SELECTORS.EMAIL_INPUT);
    this.passwordInput = page.locator(SELECTORS.PASSWORD_INPUT);
    this.submitButton = page.locator(SELECTORS.SUBMIT_BUTTON);
    this.signUpLink = page.locator('a[href*="signup"], button:has-text("Sign Up")');
    this.forgotPasswordLink = page.locator('a[href*="forgot"], button:has-text("Forgot Password")');
    this.errorMessage = page.locator(SELECTORS.ERROR_MESSAGE);
    this.successMessage = page.locator(SELECTORS.SUCCESS_MESSAGE);
  }

  async goto() {
    await this.page.goto(BASE_URL + PATHS.LOGIN);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(TIMEOUTS.PAGE_LOAD);
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForRedirect(expectedPath = null) {
    if (expectedPath) {
      await this.page.waitForURL(`**${expectedPath}**`);
    } else {
      // Wait for redirect away from login page
      await this.page.waitForURL(/.*(dashboard|home|profile|\/).*/i, { timeout: 10000 });
    }
  }

  async isLoggedIn() {
    // Check if redirected away from login page
    const currentUrl = this.page.url();
    return !currentUrl.includes('/login');
  }

  async getErrorMessage() {
    await this.errorMessage.waitFor({ timeout: 5000 }).catch(() => {});
    return await this.errorMessage.textContent();
  }
}
