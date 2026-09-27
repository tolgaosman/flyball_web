---
name: playwright-cli
description: >-
  Use this skill for writing end-to-end testing, visual regression testing, network interception, and robust element locating using Playwright.
---

# Playwright CLI Skill

This skill governs the creation of robust, flake-free end-to-end tests using Playwright.

## Best Practices

1.  **Locators**: Never use generic CSS selectors if possible. Rely on user-facing locators like `getByRole('button', { name: 'Submit' })` or `getByText()`. This makes tests resilient to DOM changes.
2.  **Auto-Waiting**: Do not use hardcoded `page.waitForTimeout()`. Rely on Playwright's built-in auto-waiting for elements to be actionable. Use `waitForLoadState('networkidle')` sparingly.
3.  **Visual Regression**: Use `expect(page).toHaveScreenshot()` for critical UI components to ensure visual consistency across builds.
4.  **Network Interception**: Mock external API calls using `page.route()` to make tests fast, deterministic, and independent of backend state.
5.  **Test Isolation**: Every test should run in a completely clean browser context. Use fixtures to set up state rather than relying on previous test executions.
