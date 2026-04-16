import { Stack } from "expo-router";
import React from "react";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
      }}
    >
      <Stack.Screen name="handshake" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="test-log" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
