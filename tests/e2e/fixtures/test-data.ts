/**
 * Test Data and Constants for E2E Tests
 */

// Character data matching the application
export const CHARACTERS = {
  alex: {
    id: 'alex',
    name: 'Alex',
    description: 'Professional and organized',
    color: '#4A90E2',
    index: 0,
  },
  maya: {
    id: 'maya',
    name: 'Maya',
    description: 'Warm and approachable',
    color: '#F59E42',
    index: 1,
  },
  jordan: {
    id: 'jordan',
    name: 'Jordan',
    description: 'Imaginative and energetic',
    color: '#E74C3C',
    index: 2,
  },
  sam: {
    id: 'sam',
    name: 'Sam',
    description: 'Logical and precise',
    color: '#7F8C8D',
    index: 3,
  },
  riley: {
    id: 'riley',
    name: 'Riley',
    description: 'Sensitive and thoughtful',
    color: '#9B59B6',
    index: 4,
  },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);

// Test messages
export const TEST_MESSAGES = {
  greeting: 'Hello, how are you today?',
  question: 'What can you help me with?',
  longMessage: 'This is a longer message to test the text input handling capabilities of the chat interface when dealing with extended user input.',
};

// Timeouts for different operations
export const TIMEOUTS = {
  avatarLoad: 60000, // 60 seconds for 3D avatar to load
  canvasRender: 30000, // 30 seconds for WebGL canvas
  connectionAttempt: 10000, // 10 seconds for voice connection
  characterSwitch: 2000, // 2 seconds for character switch animation
  pageLoad: 30000, // 30 seconds for page load
};

// Expected page content
export const EXPECTED_CONTENT = {
  pageTitle: 'Grok Voice Chat',
  subtitle: 'Choose a character and start a conversation',
  offlineStatus: 'Offline',
  liveStatus: 'Live',
  defaultCharacter: 'Alex',
  emptyStateHint: 'Click "Start Conversation" to begin',
  serverRequirement: 'python server.py running on port 8000',
};

// WebGL test utilities
export const WEBGL_TEST = {
  minCanvasWidth: 100,
  minCanvasHeight: 100,
  expectedCanvasCount: 1,
};
