import Constants from 'expo-constants';

/**
 * Get the backend URL from environment variables or app config
 * This works in both development and production builds
 */
export const getBackendUrl = (): string => {
  // Try multiple sources in order of preference
  const backendUrl = 
    // 1. From Constants.expoConfig.extra (works in built APK)
    Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
    // 2. From process.env (works in development)
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    // 3. Fallback URL (in case everything fails)
    'https://tasksync-production.up.railway.app';

  // Log for debugging
  console.log('Backend URL resolved to:', backendUrl);
  
  return backendUrl;
};

// Export as default for easy importing
export default getBackendUrl;