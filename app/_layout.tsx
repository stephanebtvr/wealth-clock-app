import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono'
import { Outfit_400Regular, Outfit_700Bold } from '@expo-google-fonts/outfit'
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue'
import { useWealthStore } from '@/store/wealthStore'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const hydrate = useWealthStore((s) => s.hydrate)

  const [fontsLoaded] = useFonts({
    'SpaceMono-Bold': SpaceMono_700Bold,
    Outfit: Outfit_400Regular,
    'Outfit-Bold': Outfit_700Bold,
    'BebasNeue-Regular': BebasNeue_400Regular,
  })

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0F' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="meeting" options={{ presentation: 'modal' }} />
        <Stack.Screen name="value-scanner" options={{ presentation: 'modal' }} />
        <Stack.Screen name="receipt-scanner" options={{ presentation: 'modal' }} />
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
