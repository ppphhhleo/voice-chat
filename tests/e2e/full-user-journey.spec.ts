import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { CHARACTER_LIST, CHARACTERS, EXPECTED_CONTENT } from './fixtures/test-data';

/**
 * Full User Journey Tests
 *
 * End-to-end tests simulating complete user workflows
 */
test.describe('Full User Journey', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
  });

  test('complete first-time user experience', async ({ page }) => {
    // Step 1: User arrives at the page
    await homePage.goto();
    await homePage.screenshotFullPage('journey-01-arrival');

    // Step 2: Page loads with header
    await expect(homePage.pageTitle).toHaveText(EXPECTED_CONTENT.pageTitle);
    await expect(homePage.subtitle).toContainText('character');

    // Step 3: Wait for 3D avatar to load
    await homePage.waitForPageLoad();
    await homePage.screenshotFullPage('journey-02-avatar-loaded');

    // Step 4: Verify default character (Alex) is displayed
    const defaultCharacter = await homePage.getCurrentCharacterName();
    expect(defaultCharacter).toBe(EXPECTED_CONTENT.defaultCharacter);

    // Step 5: User sees offline status
    await expect(homePage.connectionStatus).toContainText(EXPECTED_CONTENT.offlineStatus);

    // Step 6: User sees empty chat with instructions
    await expect(homePage.emptyStateMessage).toBeVisible();

    // Step 7: User explores different characters
    for (const char of CHARACTER_LIST) {
      await homePage.selectCharacterByIndex(char.index);
      await page.waitForTimeout(800);

      const currentName = await homePage.getCurrentCharacterName();
      expect(currentName).toBe(char.name);
    }
    await homePage.screenshotFullPage('journey-03-explored-characters');

    // Step 8: User selects preferred character (Maya)
    await homePage.selectCharacterByIndex(CHARACTERS.maya.index);
    await page.waitForTimeout(1000);
    await homePage.screenshotFullPage('journey-04-selected-maya');

    // Step 9: User notices text input is disabled
    const isInputDisabled = await homePage.isTextInputDisabled();
    expect(isInputDisabled).toBe(true);

    // Step 10: User attempts to start conversation
    await homePage.startConversation();
    await page.waitForTimeout(2000);
    await homePage.screenshotFullPage('journey-05-connection-attempt');

    // Step 11: User sees the application handles connection gracefully
    // (Whether it connects or shows error depends on backend availability)
    await expect(homePage.avatarCanvas).toBeVisible();

    console.log('Full user journey completed successfully');
  });

  test('character exploration workflow', async ({ page }) => {
    await homePage.goto();
    await homePage.waitForPageLoad();

    // User explores each character and verifies details
    const characterDetails: { name: string; description: string }[] = [];

    for (let i = 0; i < CHARACTER_LIST.length; i++) {
      await homePage.selectCharacterByIndex(i);
      await page.waitForTimeout(1000);

      const name = await homePage.getCurrentCharacterName();
      const description = await homePage.characterDescription.textContent() || '';

      characterDetails.push({ name, description: description.trim() });

      // Take screenshot of each character
      await homePage.screenshotAvatarArea(`journey-char-${i}-${name.toLowerCase()}`);
    }

    // Verify all characters were explored
    expect(characterDetails).toHaveLength(5);

    // Verify expected characters
    expect(characterDetails.map((c) => c.name)).toEqual([
      'Alex',
      'Maya',
      'Jordan',
      'Sam',
      'Riley',
    ]);

    console.log('Character exploration:', characterDetails);
  });

  test('rapid character switching stress test', async ({ page }) => {
    await homePage.goto();
    await homePage.waitForPageLoad();

    // Rapidly switch between characters
    for (let cycle = 0; cycle < 5; cycle++) {
      for (let i = 0; i < CHARACTER_LIST.length; i++) {
        await homePage.selectCharacterByIndex(i);
        // Short delay - stress test
        await page.waitForTimeout(300);
      }
    }

    // After stress test, application should still be functional
    await expect(homePage.avatarCanvas).toBeVisible();

    // Final character should be displayed correctly
    const finalCharacter = await homePage.getCurrentCharacterName();
    expect(finalCharacter).toBe(CHARACTER_LIST[CHARACTER_LIST.length - 1].name);

    await homePage.screenshotFullPage('journey-stress-test-complete');
  });

  test('page reload persistence', async ({ page }) => {
    await homePage.goto();
    await homePage.waitForPageLoad();

    // Switch to Jordan
    await homePage.selectCharacterByIndex(CHARACTERS.jordan.index);
    await page.waitForTimeout(1000);

    // Reload page
    await page.reload();
    await homePage.waitForPageLoad();

    // Default character (Alex) should be shown again (no persistence expected)
    const characterAfterReload = await homePage.getCurrentCharacterName();
    expect(characterAfterReload).toBe(EXPECTED_CONTENT.defaultCharacter);
  });

  test('accessibility basic checks', async ({ page }) => {
    await homePage.goto();
    await homePage.waitForPageLoad();

    // Page should have main heading
    await expect(homePage.pageTitle).toBeVisible();

    // Buttons should have visible text
    await expect(homePage.startButton).toContainText('Start Conversation');

    // Input should have placeholder
    await expect(homePage.textInput).toHaveAttribute('placeholder', 'Type a message...');

    // Character indicators should have title attributes
    const firstIndicator = homePage.characterIndicators.first();
    const title = await firstIndicator.getAttribute('title');
    expect(title).toBeTruthy();
  });

  test('error recovery after failed operations', async ({ page }) => {
    await homePage.goto();
    await homePage.waitForPageLoad();

    // Attempt connection (will likely fail without backend)
    await homePage.startConversation();
    await page.waitForTimeout(3000);

    // Verify application recovers
    await expect(homePage.avatarCanvas).toBeVisible();

    // Character switching should still work
    await homePage.selectCharacterByIndex(CHARACTERS.sam.index);
    await page.waitForTimeout(1000);

    const character = await homePage.getCurrentCharacterName();
    expect(character).toBe(CHARACTERS.sam.name);

    // UI should remain responsive
    await expect(homePage.characterInfo).toBeVisible();
    await expect(homePage.chatMessages).toBeVisible();

    await homePage.screenshotFullPage('journey-error-recovery');
  });
});

/**
 * Performance User Experience Tests
 */
test.describe('Performance UX', () => {
  test('initial load time should be reasonable', async ({ page }) => {
    const startTime = Date.now();

    const homePage = new HomePage(page);
    await homePage.goto();

    // Wait for basic content
    await expect(homePage.pageTitle).toBeVisible();

    const basicLoadTime = Date.now() - startTime;
    console.log(`Basic page load time: ${basicLoadTime}ms`);

    // Wait for full avatar load
    await homePage.waitForPageLoad();

    const fullLoadTime = Date.now() - startTime;
    console.log(`Full load time (with avatar): ${fullLoadTime}ms`);

    // Basic content should load within 5 seconds
    expect(basicLoadTime).toBeLessThan(5000);

    // Full load within 60 seconds (3D assets can be large)
    expect(fullLoadTime).toBeLessThan(60000);
  });

  test('character switch should feel responsive', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForPageLoad();

    // Measure character switch time
    const startTime = Date.now();

    await homePage.selectCharacterByIndex(2);

    // Wait for character name to update
    await expect(homePage.characterName).toHaveText('Jordan');

    const switchTime = Date.now() - startTime;
    console.log(`Character switch time: ${switchTime}ms`);

    // Switch should feel instant (under 2 seconds)
    expect(switchTime).toBeLessThan(2000);
  });
});
