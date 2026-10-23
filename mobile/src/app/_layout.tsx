import { Buffer } from 'buffer';
if (typeof (globalThis as any).Buffer === 'undefined') {
  (globalThis as any).Buffer = Buffer;
}

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { Colors } from '../theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="(teacher)/dashboard" />
        <Stack.Screen name="(teacher)/classes/index" />
        <Stack.Screen name="(teacher)/classes/[id]" />
        <Stack.Screen name="(teacher)/students/index" />
        <Stack.Screen name="(teacher)/students/new" />
        <Stack.Screen name="(teacher)/attendance/mark" />
        <Stack.Screen name="(teacher)/attendance/history" />
        <Stack.Screen name="(teacher)/attendance/reports" />
        <Stack.Screen name="(teacher)/profile" />
        <Stack.Screen name="(student)/dashboard" />
        <Stack.Screen name="(student)/history" />
        <Stack.Screen name="(student)/profile" />
      </Stack>
    </AuthProvider>
  );
}
