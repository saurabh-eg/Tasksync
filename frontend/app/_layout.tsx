import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { loadAuthData } = useAuthStore();

  useEffect(() => {
    loadAuthData();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="home" />
        <Stack.Screen name="tasks/add" />
        <Stack.Screen name="tasks/[id]" />
        <Stack.Screen name="settings" />
      </Stack>
    </SafeAreaProvider>
  );
}