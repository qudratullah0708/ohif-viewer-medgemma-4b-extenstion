// Configuration for the extension
// This file safely handles environment variables in both browser and Node environments

interface Config {
  API_BASE_URL: string;
  GEMINI_API_KEY?: string;
}

// Helper function to safely get environment variables
function getEnvVar(key: string, defaultValue: string = ''): string {
  // Webpack DefinePlugin will provide process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  // Fallback for other environments
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    return (window as any).__ENV__[key] || defaultValue;
  }

  return defaultValue;
}

export const config: Config = {
  API_BASE_URL: getEnvVar('REACT_APP_API_URL', 'http://localhost:8000'),
  GEMINI_API_KEY: getEnvVar('REACT_APP_GEMINI_API_KEY', ''),
};

// Export individual values for easier access
export const API_BASE_URL = config.API_BASE_URL;
export const GEMINI_API_KEY = config.GEMINI_API_KEY;
