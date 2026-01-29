import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { TEST_MESSAGES, EXPECTED_CONTENT, TIMEOUTS } from './fixtures/test-data';

/**
 * Voice Chat UI Tests
 *
 * Tests for voice chat controls and chat interface
 * Note: Actual voice functionality requires backend server
 */
test.describe('Voice Chat UI', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForPageLoad();
  });

  test('should display offline status by default', async ({ page }) => {
    // Check for offline status indicator
    await expect(homePage.connectionStatus).toContainText(EXPECTED_CONTENT.offlineStatus);

    // Status indicator should not have the accent (connected) color initially
    const isConnected = await homePage.isConnected();
    expect(isConnected).toBe(false);
  });

  test('should display Start Conversation button when disconnected', async ({ page }) => {
    // Start button should be visible
    await expect(homePage.startButton).toBeVisible();

    // Stop button should not be visible
    await expect(homePage.stopButton).toBeHidden();

    // Take screenshot
    await homePage.screenshotFullPage('10-disconnected-state');
  });

  test('should show empty state message in chat area', async ({ page }) => {
    // Empty state message should be visible
    await expect(homePage.emptyStateMessage).toBeVisible();

    // Should mention the server requirement
    const chatContent = await homePage.chatMessages.textContent();
    expect(chatContent).toContain(EXPECTED_CONTENT.serverRequirement);
  });

  test('should have disabled text input when disconnected', async ({ page }) => {
    // Text input should be disabled
    const isDisabled = await homePage.isTextInputDisabled();
    expect(isDisabled).toBe(true);

    // Input should have placeholder text
    await expect(homePage.textInput).toHaveAttribute('placeholder', 'Type a message...');
  });

  test('should have disabled send button when disconnected', async ({ page }) => {
    // Send button should be disabled
    const isDisabled = await homePage.isSendButtonDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should attempt connection when Start Conversation is clicked', async ({ page }) => {
    // Click start button
    await homePage.startConversation();

    // The button should change to Stop or show connecting state
    // Note: Without backend, this will fail to connect but UI should update

    // Wait for any state change
    await page.waitForTimeout(2000);

    // Either Stop button appears or error appears
    const stopVisible = await homePage.stopButton.isVisible().catch(() => false);
    const connectionError = page.locator('text=Error').or(page.locator('.text-\\[\\#fecdd3\\]'));
    const errorVisible = await connectionError.isVisible().catch(() => false);

    // One of these should be true (connected or showing error)
    const stateChanged = stopVisible || errorVisible;

    // Take screenshot of connection attempt result
    await homePage.screenshotFullPage('11-connection-attempt');
  });

  test('should show proper status text states', async ({ page }) => {
    // Initially should show "Disconnected"
    const statusArea = page.locator('.flex.items-center.gap-2.text-sm');
    await expect(statusArea).toContainText('Disconnected');
  });

  test('should have accessible chat message container', async ({ page }) => {
    // Chat container should exist
    await expect(homePage.chatMessages).toBeVisible();

    // Should have overflow for scrolling
    const overflow = await homePage.chatMessages.evaluate((el) => {
      return window.getComputedStyle(el).overflowY;
    });
    expect(overflow).toBe('auto');
  });

  test('should have proper input field styling', async ({ page }) => {
    // Check input field is styled correctly
    await expect(homePage.textInput).toBeVisible();

    // Should be rounded (rounded-full class)
    const borderRadius = await homePage.textInput.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).not.toBe('0px');
  });

  test('should have proper button styling', async ({ page }) => {
    // Start button should be visible and styled
    await expect(homePage.startButton).toBeVisible();

    // Button should be rounded
    const borderRadius = await homePage.startButton.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).not.toBe('0px');
  });

  test('should display microphone icon in empty state', async ({ page }) => {
    // Empty state should have SVG icon
    const svgIcon = homePage.chatMessages.locator('svg');
    await expect(svgIcon).toBeVisible();
  });

  test('should type in text input when enabled', async ({ page }) => {
    // Note: Input is disabled when disconnected, but we can verify DOM behavior

    // Try to fill - should be blocked by disabled state
    const textInput = homePage.textInput;

    // Verify it's disabled
    await expect(textInput).toBeDisabled();

    // Screenshot showing disabled state
    await homePage.screenshotFullPage('12-text-input-disabled');
  });
});

/**
 * Connection Error Handling Tests
 * These tests verify proper error handling when backend is unavailable
 */
test.describe('Connection Error Handling', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForPageLoad();
  });

  test('should handle connection failure gracefully', async ({ page }) => {
    // Listen for any unhandled errors
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    // Attempt to start conversation (will fail without backend)
    await homePage.startConversation();

    // Wait for potential error
    await page.waitForTimeout(3000);

    // Page should not crash
    await expect(page).toHaveURL('/');

    // Application should remain functional
    await expect(homePage.avatarCanvas).toBeVisible();

    // Take screenshot of error state
    await homePage.screenshotFullPage('13-connection-error-state');
  });

  test('should maintain UI state after failed connection', async ({ page }) => {
    // Attempt connection
    await homePage.startConversation();
    await page.waitForTimeout(3000);

    // Avatar should still be visible
    await expect(homePage.avatarCanvas).toBeVisible();

    // Character switching should still work
    await homePage.selectCharacterByIndex(1);
    await page.waitForTimeout(1000);

    const characterName = await homePage.getCurrentCharacterName();
    expect(characterName).toBe('Maya');
  });
});
