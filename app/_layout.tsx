import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0F' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="meeting" options={{ presentation: 'modal' }} />
        <Stack.Screen name="value-scanner" options={{ presentation: 'modal' }} />
        <Stack.Screen name="negative-time" options={{ presentation: 'modal' }} />
        <Stack.Screen name="snapshot" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="paywall"
          options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  )
}
