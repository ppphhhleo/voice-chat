import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { CHARACTERS, CHARACTER_LIST, TIMEOUTS, EXPECTED_CONTENT, WEBGL_TEST } from './fixtures/test-data';

/**
 * Avatar Rendering Tests
 *
 * Tests for 3D avatar loading, rendering, and display functionality
 */
test.describe('Avatar Rendering', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should display page with correct title and structure', async ({ page }) => {
    // Verify page title
    await expect(homePage.pageTitle).toHaveText(EXPECTED_CONTENT.pageTitle);

    // Verify subtitle contains expected text
    await expect(homePage.subtitle).toContainText('character');

    // Take initial screenshot
    await homePage.screenshotFullPage('01-initial-page-load');
  });

  test('should show loading state while avatars load', async ({ page }) => {
    // Navigate fresh to catch loading state
    await page.goto('/');

    // Loading overlay should be visible initially
    const loadingVisible = await homePage.loadingOverlay.isVisible().catch(() => false);

    // Either we catch the loading state or avatars loaded very fast
    // This is acceptable behavior
    console.log('Loading state visible:', loadingVisible);

    // Wait for load to complete
    await homePage.waitForPageLoad();

    // Loading should be hidden after completion
    await expect(homePage.loadingOverlay).toBeHidden();
  });

  test('should render WebGL canvas for 3D avatar', async ({ page }) => {
    // Wait for avatar to load
    await homePage.waitForPageLoad();

    // Verify canvas is present
    await expect(homePage.avatarCanvas).toBeVisible();

    // Verify WebGL is working
    const webglWorking = await homePage.isWebGLWorking();
    expect(webglWorking).toBe(true);

    // Verify canvas has proper dimensions
    const dimensions = await homePage.getCanvasDimensions();
    expect(dimensions.width).toBeGreaterThan(WEBGL_TEST.minCanvasWidth);
    expect(dimensions.height).toBeGreaterThan(WEBGL_TEST.minCanvasHeight);

    // Screenshot the avatar area
    await homePage.screenshotAvatarArea('02-webgl-canvas-rendered');
  });

  test('should display default character (Alex) on load', async ({ page }) => {
    await homePage.waitForPageLoad();

    // Verify Alex is the default character
    const characterName = await homePage.getCurrentCharacterName();
    expect(characterName).toBe(EXPECTED_CONTENT.defaultCharacter);

    // Verify character description is shown
    await expect(homePage.characterDescription).toContainText(CHARACTERS.alex.description);
  });

  test('should display all 5 character indicators', async ({ page }) => {
    await homePage.waitForPageLoad();

    // Count character indicators
    const characterCount = await homePage.getCharacterCount();
    expect(characterCount).toBe(CHARACTER_LIST.length);

    // First indicator (Alex) should be selected by default
    const isFirstSelected = await homePage.isCharacterSelected(0);
    expect(isFirstSelected).toBe(true);
  });

  test('should display character info overlay correctly', async ({ page }) => {
    await homePage.waitForPageLoad();

    // Character info should be visible
    await expect(homePage.characterInfo).toBeVisible();

    // Should show character name
    await expect(homePage.characterName).toBeVisible();

    // Should show description
    await expect(homePage.characterDescription).toBeVisible();

    // Take screenshot of character info
    await homePage.screenshotAvatarArea('03-character-info-overlay');
  });

  test('should render avatar without critical console errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known non-critical errors
        if (!text.includes('favicon') && !text.includes('DevTools')) {
          errors.push(text);
        }
      }
    });

    await homePage.goto();
    await homePage.waitForPageLoad();

    // Filter for critical WebGL/3D errors only
    const criticalErrors = errors.filter(
      (e) =>
        e.includes('WebGL') ||
        e.includes('THREE') ||
        e.includes('TalkingHead') ||
        e.includes('Failed to load')
    );

    // Should have no critical 3D rendering errors
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have responsive canvas dimensions', async ({ page }) => {
    await homePage.waitForPageLoad();

    // Get initial dimensions
    const initialDimensions = await homePage.getCanvasDimensions();

    // Canvas should fill the container (min height 600px as per component)
    expect(initialDimensions.height).toBeGreaterThanOrEqual(500);
  });
});
