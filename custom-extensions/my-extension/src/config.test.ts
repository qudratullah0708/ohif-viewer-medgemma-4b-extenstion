// Simple test to verify configuration works
import { API_BASE_URL, GEMINI_API_KEY } from './config';

console.log('Configuration test:');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('GEMINI_API_KEY:', GEMINI_API_KEY ? 'Set' : 'Not set');

// Test that the config exports work
export const testConfig = {
  apiUrl: API_BASE_URL,
  hasGeminiKey: Boolean(GEMINI_API_KEY),
};
