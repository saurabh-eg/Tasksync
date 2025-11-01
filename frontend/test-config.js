// Quick test to verify environment variable access
import Constants from 'expo-constants';

console.log('=== Environment Variable Test ===');
console.log('process.env.EXPO_PUBLIC_BACKEND_URL:', process.env.EXPO_PUBLIC_BACKEND_URL);
console.log('Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL:', Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL);
console.log('Constants.expoConfig?.extra (full):', Constants.expoConfig?.extra);

// Simulate our utility function
function getBackendUrl() {
  const devUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  const prodUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
  const fallback = 'https://tasksyncpro.up.railway.app';
  
  const url = devUrl || prodUrl || fallback;
  
  console.log('getBackendUrl() result:', url);
  return url;
}

getBackendUrl();