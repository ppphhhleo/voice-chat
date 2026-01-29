import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Grok Voice Chat Home Page
 *
 * Encapsulates all page interactions for maintainable tests
 */
export class HomePage {
  readonly page: Page;

  // Header elements
  readonly pageTitle: Locator;
  readonly subtitle: Locator;
  readonly connectionStatus: Locator;
  readonly statusIndicator: Locator;

  // Avatar Gallery elements
  readonly avatarGalleryContainer: Locator;
  readonly avatarCanvas: Locator;
  readonly loadingOverlay: Locator;
  readonly characterInfo: Locator;
  readonly characterName: Locator;
  readonly characterDescription: Locator;
  readonly characterIndicators: Locator;

  // Connection Controls
  readonly startButton: Locator;
  readonly stopButton: Locator;
  readonly connectionStatusText: Locator;

  // Chat Interface
  readonly chatMessages: Locator;
  readonly emptyStateMessage: Locator;
  readonly textInput: Locator;
  readonly sendButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.locator('h1');
    this.subtitle = page.locator('p.text-sm').first();
    this.connectionStatus = page.locator('span.inline-flex.items-center');
    this.statusIndicator = page.locator('span.w-2\\.5.h-2\\.5.rounded-full');

    // Avatar Gallery
    this.avatarGalleryContainer = page.locator('.card.overflow-hidden');
    this.avatarCanvas = page.locator('canvas');
    this.loadingOverlay = page.locator('text=Loading avatars...');
    this.characterInfo = page.locator('.absolute.bottom-4');
    this.characterName = page.locator('.absolute.bottom-4 h3');
    this.characterDescription = page.locator('.absolute.bottom-4 p.text-sm');
    this.characterIndicators = page.locator('.absolute.top-4 .rounded-full');

    // Connection Controls
    this.startButton = page.locator('button:has-text("Start Conversation")');
    this.stopButton = page.locator('button:has-text("Stop")');
    this.connectionStatusText = page.locator('.flex.items-center.gap-2 span.text-\\[var\\(--muted\\)\\]');

    // Chat Interface
    this.chatMessages = page.locator('.card.p-5.h-72');
    this.emptyStateMessage = page.locator('text=Click "Start Conversation" to begin');
    this.textInput = page.locator('input[placeholder="Type a message..."]');
    this.sendButton = page.locator('button:has(svg path[d*="12 19l9 2"])');
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for page to be fully loaded (including avatar)
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    // Wait for loading overlay to disappear (avatar loaded)
    await this.loadingOverlay.waitFor({ state: 'hidden', timeout: 60000 });
  }

  /**
   * Wait for 3D canvas to be rendered
   */
  async waitForCanvasRender() {
    await this.avatarCanvas.waitFor({ state: 'visible', timeout: 30000 });
    // Give WebGL time to render first frame
    await this.page.waitForTimeout(2000);
  }

  /**
   * Get the current character name
   */
  async getCurrentCharacterName(): Promise<string> {
    return await this.characterName.textContent() || '';
  }

  /**
   * Get the number of available characters
   */
  async getCharacterCount(): Promise<number> {
    return await this.characterIndicators.count();
  }

  /**
   * Select a character by index (0-based)
   */
  async selectCharacterByIndex(index: number) {
    const indicator = this.characterIndicators.nth(index);
    await indicator.click();
    // Wait for character switch animation
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if a specific character is selected
   */
  async isCharacterSelected(index: number): Promise<boolean> {
    const indicator = this.characterIndicators.nth(index);
    const classes = await indicator.getAttribute('class') || '';
    return classes.includes('scale-150');
  }

  /**
   * Start a voice conversation
   */
  async startConversation() {
    await this.startButton.click();
    // Wait for connection attempt
    await this.page.waitForTimeout(1000);
  }

  /**
   * Stop the voice conversation
   */
  async stopConversation() {
    await this.stopButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if connected
   */
  async isConnected(): Promise<boolean> {
    const statusText = await this.connectionStatus.textContent() || '';
    return statusText.includes('Live');
  }

  /**
   * Type a message in the text input
   */
  async typeMessage(message: string) {
    await this.textInput.fill(message);
  }

  /**
   * Send the typed message
   */
  async sendMessage() {
    await this.sendButton.click();
  }

  /**
   * Check if text input is disabled
   */
  async isTextInputDisabled(): Promise<boolean> {
    return await this.textInput.isDisabled();
  }

  /**
   * Check if send button is disabled
   */
  async isSendButtonDisabled(): Promise<boolean> {
    return await this.sendButton.isDisabled();
  }

  /**
   * Take a screenshot of the avatar area
   */
  async screenshotAvatarArea(name: string) {
    await this.avatarGalleryContainer.screenshot({
      path: `test-results/screenshots/${name}.png`,
    });
  }

  /**
   * Take a full page screenshot
   */
  async screenshotFullPage(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Check if WebGL is supported and working
   */
  async isWebGLWorking(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      return gl !== null;
    });
  }

  /**
   * Get canvas dimensions
   */
  async getCanvasDimensions(): Promise<{ width: number; height: number }> {
    const canvas = await this.avatarCanvas.boundingBox();
    return {
      width: canvas?.width || 0,
      height: canvas?.height || 0,
    };
  }

  /**
   * Check for console errors
   */
  async getConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }
}
