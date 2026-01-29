import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { CHARACTERS, CHARACTER_LIST, TIMEOUTS } from './fixtures/test-data';

/**
 * Character Switching Tests
 *
 * Tests for switching between different avatar characters
 */
test.describe('Character Switching', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForPageLoad();
  });

  test('should switch to Maya when clicking second indicator', async ({ page }) => {
    // Click Maya's indicator (index 1)
    await homePage.selectCharacterByIndex(CHARACTERS.maya.index);

    // Wait for transition
    await page.waitForTimeout(TIMEOUTS.characterSwitch);

    // Verify character name changed
    const characterName = await homePage.getCurrentCharacterName();
    expect(characterName).toBe(CHARACTERS.maya.name);

    // Verify description updated
    await expect(homePage.characterDescription).toContainText(CHARACTERS.maya.description);

    // Take screenshot
    await homePage.screenshotAvatarArea('04-character-maya');
  });

  test('should switch to Jordan when clicking third indicator', async ({ page }) => {
    await homePage.selectCharacterByIndex(CHARACTERS.jordan.index);
    await page.waitForTimeout(TIMEOUTS.characterSwitch);

    const characterName = await homePage.getCurrentCharacterName();
    expect(characterName).toBe(CHARACTERS.jordan.name);

    await expect(homePage.characterDescription).toContainText(CHARACTERS.jordan.description);
    await homePage.screenshotAvatarArea('05-character-jordan');
  });

  test('should switch to Sam when clicking fourth indicator', async ({ page }) => {
    await homePage.selectCharacterByIndex(CHARACTERS.sam.index);
    await page.waitForTimeout(TIMEOUTS.characterSwitch);

    const characterName = await homePage.getCurrentCharacterName();
    expect(characterName).toBe(CHARACTERS.sam.name);

    await expect(homePage.characterDescription).toContainText(CHARACTERS.sam.description);
    await homePage.screenshotAvatarArea('06-character-sam');
  });

  test('should switch to Riley when clicking fifth indicator', async ({ page }) => {
    await homePage.selectCharacterByIndex(CHARACTERS.riley.index);
    await page.waitForTimeout(TIMEOUTS.characterSwitch);

    const characterName = await homePage.getCurrentCharacterName();
    expect(characterName).toBe(CHARACTERS.riley.name);

    await expect(homePage.characterDescription).toContainText(CHARACTERS.riley.description);
    await homePage.screenshotAvatarArea('07-character-riley');
  });

  test('should update visual indicator when switching characters', async ({ page }) => {
    // Initially Alex should be selected (scaled)
    let isSelected = await homePage.isCharacterSelected(CHARACTERS.alex.index);
    expect(isSelected).toBe(true);

    // Switch to Maya
    await homePage.selectCharacterByIndex(CHARACTERS.maya.index);
    await page.waitForTimeout(TIMEOUTS.characterSwitch);

    // Maya should now be selected
    isSelected = await homePage.isCharacterSelected(CHARACTERS.maya.index);
    expect(isSelected).toBe(true);

    // Alex should no longer be scaled
    isSelected = await homePage.isCharacterSelected(CHARACTERS.alex.index);
    expect(isSelected).toBe(false);
  });

  test('should cycle through all characters correctly', async ({ page }) => {
    // Test each character in sequence
    for (const character of CHARACTER_LIST) {
      await homePage.selectCharacterByIndex(character.index);
      await page.waitForTimeout(1000);

      const characterName = await homePage.getCurrentCharacterName();
      expect(characterName).toBe(character.name);

      // Verify the correct indicator is highlighted
      const isSelected = await homePage.isCharacterSelected(character.index);
      expect(isSelected).toBe(true);
    }

    // Take final screenshot showing last character
    await homePage.screenshotAvatarArea('08-character-cycle-complete');
  });

  test('should maintain canvas visibility when switching characters', async ({ page }) => {
    // Canvas should be visible initially
    await expect(homePage.avatarCanvas).toBeVisible();

    // Switch through characters
    for (let i = 0; i < CHARACTER_LIST.length; i++) {
      await homePage.selectCharacterByIndex(i);
      await page.waitForTimeout(500);

      // Canvas should remain visible
      await expect(homePage.avatarCanvas).toBeVisible();
    }
  });

  test('should switch back to Alex from another character', async ({ page }) => {
    // Switch to Riley first
    await homePage.selectCharacterByIndex(CHARACTERS.riley.index);
    await page.waitForTimeout(TIMEOUTS.characterSwitch);

    let characterName = await homePage.getCurrentCharacterName();
    expect(characterName).toBe(CHARACTERS.riley.name);

    // Switch back to Alex
    await homePage.selectCharacterByIndex(CHARACTERS.alex.index);
    await page.waitForTimeout(TIMEOUTS.characterSwitch);

    characterName = await homePage.getCurrentCharacterName();
    expect(characterName).toBe(CHARACTERS.alex.name);

    await homePage.screenshotAvatarArea('09-switch-back-to-alex');
  });

  test('should show hover cursor on character indicators', async ({ page }) => {
    // Get the first character indicator
    const indicator = homePage.characterIndicators.first();

    // Verify cursor style (should be pointer from CSS)
    const cursor = await indicator.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    expect(cursor).toBe('pointer');
  });
});
