import AsyncStorage from '@react-native-async-storage/async-storage'
import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'

export default function Index() {
  const [ready, setReady] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('wealthclock_onboarding_done').then((value) => {
      setOnboardingDone(value === 'true')
      setReady(true)
    })
  }, [])

  if (!ready) return <View style={{ flex: 1, backgroundColor: '#0A0A0F' }} />
  if (!onboardingDone) return <Redirect href="/(onboarding)/welcome" />
  return <Redirect href="/(tabs)" />
}
