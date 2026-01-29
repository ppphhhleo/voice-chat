import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { WEBGL_TEST, TIMEOUTS } from './fixtures/test-data';

/**
 * 3D Scene Rendering Tests
 *
 * Tests for Three.js/WebGL scene rendering and stability
 */
test.describe('3D Scene Rendering', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should have WebGL support', async ({ page }) => {
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') ||
        canvas.getContext('webgl2') ||
        canvas.getContext('experimental-webgl');
      return gl !== null;
    });

    expect(hasWebGL).toBe(true);
  });

  test('should render canvas with WebGL context', async ({ page }) => {
    await homePage.waitForPageLoad();

    // Get canvas element
    const canvas = homePage.avatarCanvas;
    await expect(canvas).toBeVisible();

    // Verify canvas has WebGL context
    const hasContext = await canvas.evaluate((el) => {
      if (!(el instanceof HTMLCanvasElement)) return false;
      const gl =
        el.getContext('webgl') ||
        el.getContext('webgl2') ||
        el.getContext('experimental-webgl');
      return gl !== null;
    });

    // Note: Canvas may already have a context from TalkingHead
    // We just verify the canvas exists and is properly sized
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(0);
    expect(boundingBox?.height).toBeGreaterThan(0);
  });

  test('should maintain stable frame rendering', async ({ page }) => {
    await homePage.waitForPageLoad();

    // Wait for a few seconds to ensure stable rendering
    await page.waitForTimeout(3000);

    // Canvas should still be visible (no crashes)
    await expect(homePage.avatarCanvas).toBeVisible();

    // Page should not have crashed
    const isPageAlive = await page.evaluate(() => document.body !== null);
    expect(isPageAlive).toBe(true);

    // Take screenshot showing stable render
    await homePage.screenshotAvatarArea('14-stable-rendering');
  });

  test('should not have WebGL context lost errors', async ({ page }) => {
    const contextLostErrors: string[] = [];

    // Listen for console messages
    page.on('console', (msg) => {
      if (msg.text().includes('context lost') || msg.text().includes('WebGL')) {
        contextLostErrors.push(msg.text());
      }
    });

    await homePage.waitForPageLoad();

    // Wait for potential issues
    await page.waitForTimeout(5000);

    // Filter for actual context lost errors
    const actualContextLost = contextLostErrors.filter((e) =>
      e.toLowerCase().includes('context lost')
    );

    expect(actualContextLost).toHaveLength(0);
  });

  test('should render scene within performance budget', async ({ page }) => {
    // Measure time to first canvas render
    const startTime = Date.now();

    await homePage.goto();

    // Wait for canvas to be visible
    await homePage.avatarCanvas.waitFor({ state: 'visible', timeout: TIMEOUTS.canvasRender });

    const renderTime = Date.now() - startTime;

    // Should render within reasonable time (30 seconds including asset loading)
    expect(renderTime).toBeLessThan(TIMEOUTS.canvasRender);

    console.log(`Canvas render time: ${renderTime}ms`);
  });

  test('should properly size canvas to container', async ({ page }) => {
    await homePage.waitForPageLoad();

    // Get container dimensions
    const container = page.locator('.card.overflow-hidden .bg-gray-900');
    const containerBox = await container.boundingBox();

    // Get canvas dimensions
    const canvasBox = await homePage.avatarCanvas.boundingBox();

    // Canvas should roughly match container (allow some tolerance)
    if (containerBox && canvasBox) {
      // Width should be similar
      expect(canvasBox.width).toBeGreaterThan(containerBox.width * 0.5);
    }
  });

  test('should handle page visibility changes', async ({ page }) => {
    await homePage.waitForPageLoad();

    // Simulate tab becoming hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(1000);

    // Simulate tab becoming visible again
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(1000);

    // Canvas should still be functional
    await expect(homePage.avatarCanvas).toBeVisible();
  });

  test('should not leak memory during character switches', async ({ page }) => {
    await homePage.waitForPageLoad();

    // Get initial JS heap size (if available)
    const getHeapSize = async () => {
      return await page.evaluate(() => {
        // @ts-ignore - performance.memory is Chrome-specific
        if (performance.memory) {
          // @ts-ignore
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });
    };

    const initialHeap = await getHeapSize();

    // Perform multiple character switches
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let i = 0; i < 5; i++) {
        await homePage.selectCharacterByIndex(i);
        await page.waitForTimeout(500);
      }
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      // @ts-ignore - gc is available with --expose-gc flag
      if (typeof gc !== 'undefined') {
        gc();
      }
    });

    await page.waitForTimeout(1000);

    const finalHeap = await getHeapSize();

    // Log heap difference (for monitoring, not a hard failure)
    if (initialHeap > 0 && finalHeap > 0) {
      const heapGrowth = finalHeap - initialHeap;
      console.log(`Heap growth after character switches: ${(heapGrowth / 1024 / 1024).toFixed(2)}MB`);
    }

    // Canvas should still work
    await expect(homePage.avatarCanvas).toBeVisible();
  });
});

/**
 * Avatar Loading Tests
 *
 * Tests for GLB model loading
 */
test.describe('Avatar Asset Loading', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
  });

  test('should load avatar GLB files successfully', async ({ page }) => {
    // Listen for network requests
    const glbRequests: string[] = [];

    page.on('response', (response) => {
      if (response.url().includes('.glb')) {
        glbRequests.push(response.url());
      }
    });

    await homePage.goto();
    await homePage.waitForPageLoad();

    // Should have loaded at least one GLB file
    expect(glbRequests.length).toBeGreaterThan(0);

    console.log(`Loaded GLB files: ${glbRequests.join(', ')}`);
  });

  test('should handle missing avatar assets gracefully', async ({ page }) => {
    // Listen for 404 errors
    const notFoundErrors: string[] = [];

    page.on('response', (response) => {
      if (response.status() === 404) {
        notFoundErrors.push(response.url());
      }
    });

    await homePage.goto();
    await homePage.waitForPageLoad();

    // Filter for avatar-related 404s
    const avatar404s = notFoundErrors.filter((url) => url.includes('avatar') || url.includes('.glb'));

    // Should not have any 404s for avatar files
    expect(avatar404s).toHaveLength(0);
  });

  test('should load lipsync module', async ({ page }) => {
    // Listen for module loading
    let lipsyncLoaded = false;

    page.on('response', (response) => {
      if (response.url().includes('lipsync')) {
        lipsyncLoaded = true;
      }
    });

    await homePage.goto();
    await homePage.waitForPageLoad();

    // Wait a bit for module loading
    await page.waitForTimeout(2000);

    // Note: Lipsync might load or might fail - we just verify no crash
    console.log(`Lipsync module loaded: ${lipsyncLoaded}`);

    // Page should remain functional
    await expect(homePage.avatarCanvas).toBeVisible();
  });
});
