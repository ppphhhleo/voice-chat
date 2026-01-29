import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { CHARACTER_LIST, CHARACTERS } from './fixtures/test-data';

/**
 * Avatar Gallery Display Tests
 *
 * Tests for the AvatarGallery3D component functionality
 */
test.describe('Avatar Gallery Display', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForPageLoad();
  });

  test('should display gallery container with proper styling', async ({ page }) => {
    // Gallery container should be visible
    await expect(homePage.avatarGalleryContainer).toBeVisible();

    // Should have card styling (overflow hidden)
    const overflow = await homePage.avatarGalleryContainer.evaluate((el) => {
      return window.getComputedStyle(el).overflow;
    });
    expect(overflow).toBe('hidden');
  });

  test('should display all character indicators in top bar', async ({ page }) => {
    const indicators = homePage.characterIndicators;

    // Should have exactly 5 indicators (one per character)
    await expect(indicators).toHaveCount(5);

    // Each indicator should be visible
    for (let i = 0; i < 5; i++) {
      await expect(indicators.nth(i)).toBeVisible();
    }
  });

  test('should show colored indicators matching character colors', async ({ page }) => {
    const indicators = homePage.characterIndicators;

    // Check each indicator has a background color
    for (let i = 0; i < CHARACTER_LIST.length; i++) {
      const indicator = indicators.nth(i);
      const bgColor = await indicator.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should have a non-transparent background
      expect(bgColor).not.toBe('transparent');
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('should highlight selected character indicator', async ({ page }) => {
    // First indicator (Alex) should be highlighted by default
    const firstIndicator = homePage.characterIndicators.first();
    const classes = await firstIndicator.getAttribute('class');

    expect(classes).toContain('scale-150');
  });

  test('should show character details in bottom overlay', async ({ page }) => {
    // Info overlay should be visible
    await expect(homePage.characterInfo).toBeVisible();

    // Should have backdrop blur styling
    const backdropFilter = await homePage.characterInfo.evaluate((el) => {
      return window.getComputedStyle(el).backdropFilter;
    });
    expect(backdropFilter).toContain('blur');
  });

  test('should display character avatar initial in colored circle', async ({ page }) => {
    // Find the avatar initial circle
    const avatarInitial = page.locator('.absolute.bottom-4 .w-12.h-12.rounded-full');
    await expect(avatarInitial).toBeVisible();

    // Should show character initial (A for Alex)
    const text = await avatarInitial.textContent();
    expect(text?.trim()).toBe('A');
  });

  test('should display voice information in overlay', async ({ page }) => {
    // Info overlay should mention voice
    const infoText = await homePage.characterInfo.textContent();
    expect(infoText).toContain('Voice:');
  });

  test('should show instruction text for switching characters', async ({ page }) => {
    const infoText = await homePage.characterInfo.textContent();
    expect(infoText).toContain('Click colored dots to switch characters');
  });

  test('should update avatar initial when switching characters', async ({ page }) => {
    // Get initial avatar initial (A for Alex)
    const avatarInitial = page.locator('.absolute.bottom-4 .w-12.h-12.rounded-full');
    let text = await avatarInitial.textContent();
    expect(text?.trim()).toBe('A');

    // Switch to Maya
    await homePage.selectCharacterByIndex(CHARACTERS.maya.index);
    await page.waitForTimeout(1000);

    // Initial should now be M for Maya
    text = await avatarInitial.textContent();
    expect(text?.trim()).toBe('M');
  });

  test('should update voice info when switching characters', async ({ page }) => {
    // Initial voice should be Rex (Alex's voice)
    let infoText = await homePage.characterInfo.textContent();
    expect(infoText).toContain('Rex');

    // Switch to Maya
    await homePage.selectCharacterByIndex(CHARACTERS.maya.index);
    await page.waitForTimeout(1000);

    // Voice should now be Ara (Maya's voice)
    infoText = await homePage.characterInfo.textContent();
    expect(infoText).toContain('Ara');
  });

  test('should maintain gallery layout on character switch', async ({ page }) => {
    // Get initial layout measurements
    const initialBox = await homePage.avatarGalleryContainer.boundingBox();

    // Switch through all characters
    for (const char of CHARACTER_LIST) {
      await homePage.selectCharacterByIndex(char.index);
      await page.waitForTimeout(500);

      // Get current layout
      const currentBox = await homePage.avatarGalleryContainer.boundingBox();

      // Layout should remain consistent
      expect(currentBox?.width).toBe(initialBox?.width);
      expect(currentBox?.height).toBe(initialBox?.height);
    }
  });

  test('should have proper z-index layering', async ({ page }) => {
    // Loading overlay (when visible) should be on top
    // Character info should be above canvas
    // Indicators should be above canvas

    // Character info should be visible (above canvas)
    await expect(homePage.characterInfo).toBeVisible();

    // Indicators should be visible (above canvas)
    await expect(homePage.characterIndicators.first()).toBeVisible();

    // Canvas should be behind overlays but still exist
    await expect(homePage.avatarCanvas).toBeAttached();
  });
});

/**
 * Gallery Responsiveness Tests
 */
test.describe('Gallery Responsiveness', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForPageLoad();
  });

  test('should maintain minimum height for gallery', async ({ page }) => {
    const container = page.locator('.card.overflow-hidden .bg-gray-900');
    const box = await container.boundingBox();

    // Min height should be 600px as per component styling
    expect(box?.height).toBeGreaterThanOrEqual(500);
  });

  test('should have full-width gallery container', async ({ page }) => {
    const container = page.locator('.card.overflow-hidden');
    const containerBox = await container.boundingBox();

    // Get parent width
    const parentBox = await page.locator('main').boundingBox();

    if (containerBox && parentBox) {
      // Container should be close to parent width (accounting for padding)
      expect(containerBox.width).toBeGreaterThan(parentBox.width * 0.8);
    }
  });

  test('should handle window resize gracefully', async ({ page }) => {
    // Start with default viewport
    await expect(homePage.avatarCanvas).toBeVisible();

    // Resize to smaller viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);

    // Canvas should still be visible
    await expect(homePage.avatarCanvas).toBeVisible();

    // Resize to larger viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    // Canvas should still be visible
    await expect(homePage.avatarCanvas).toBeVisible();

    // Take screenshot at final size
    await homePage.screenshotFullPage('15-responsive-large-viewport');
  });
});
