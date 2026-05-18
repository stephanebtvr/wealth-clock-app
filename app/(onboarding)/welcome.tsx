import { useEffect, useState } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function WelcomeScreen() {
  const router = useRouter()
  const [pulse] = useState(() => new Animated.Value(1))

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [pulse])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.appName}>WealthClock</Text>
          <Text style={styles.tagline}>Votre temps a une valeur.</Text>
        </View>

        <View style={styles.counterBlock}>
          <Text style={styles.counterLabel}>Vous gagnez</Text>
          <Animated.Text style={[styles.counterValue, { transform: [{ scale: pulse }] }]}>
            0,003 €/sec
          </Animated.Text>
          <Text style={styles.counterSub}>Calculez votre vraie valeur</Text>
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            onPress={() => router.push('/(onboarding)/salary-input')}
          >
            <Text style={styles.ctaText}>Calculer mon salaire</Text>
          </Pressable>
          <Text style={styles.privacy}>Vos données restent sur votre appareil</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingVertical: 24,
  },
  top: {
    alignItems: 'center',
    paddingTop: 32,
  },
  appName: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 36,
    color: '#00FF87',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#8888AA',
    marginTop: 8,
  },
  counterBlock: {
    alignItems: 'center',
  },
  counterLabel: {
    fontSize: 14,
    color: '#8888AA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  counterValue: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 48,
    color: '#00FF87',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  counterSub: {
    fontSize: 14,
    color: '#44445A',
    marginTop: 12,
  },
  bottom: {
    alignItems: 'center',
    gap: 16,
  },
  cta: {
    backgroundColor: '#00FF87',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaPressed: {
    backgroundColor: '#00CC6A',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A0A0F',
    letterSpacing: 0.2,
  },
  privacy: {
    fontSize: 12,
    color: '#44445A',
  },
})
