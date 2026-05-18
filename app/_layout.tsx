import { useEffect } from 'react'
import { Platform } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { SpaceMono_700Bold } from '@expo-google-fonts/space-mono'
import { Outfit_400Regular, Outfit_700Bold } from '@expo-google-fonts/outfit'
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue'
import Purchases from 'react-native-purchases'
import * as Sentry from '@sentry/react-native'
import { useWealthStore } from '@/store/wealthStore'
import { usePurchases } from '@/hooks/usePurchases'
import { REVENUECAT_IOS_KEY, REVENUECAT_ANDROID_KEY } from '@/config/revenuecat'

SplashScreen.preventAutoHideAsync()

// ─── Sentry ───────────────────────────────────────────────────────────────────

const SENTRY_DSN = process.env['EXPO_PUBLIC_SENTRY_DSN']

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: false,
    environment: process.env['EXPO_PUBLIC_ENV'] ?? 'development',
    beforeSend(event) {
      // Strip salary from all breadcrumbs and extra data — never send financial PII
      if (event.extra) {
        const sanitized = { ...event.extra }
        delete sanitized['salary']
        delete sanitized['annualSalary']
        delete sanitized['secondRate']
        event.extra = sanitized
      }
      return event
    },
  })
}

// ─── RevenueCat ───────────────────────────────────────────────────────────────

const rcKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY
if (rcKey) {
  Purchases.configure({ apiKey: rcKey })
}

export default function RootLayout() {
  const hydrate = useWealthStore((s) => s.hydrate)
  const { checkPremiumStatus } = usePurchases()

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
    checkPremiumStatus()
  }, [checkPremiumStatus])

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
