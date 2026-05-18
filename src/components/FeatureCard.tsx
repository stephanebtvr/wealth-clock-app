import React, { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useWealthStore } from '../store/wealthStore'

interface Props {
  emoji: string
  title: string
  subtitle: string
  route: string
  isPremiumFeature?: boolean
}

const FeatureCard = memo(function FeatureCard({
  emoji,
  title,
  subtitle,
  route,
  isPremiumFeature = true,
}: Props) {
  const router = useRouter()
  const isPremium = useWealthStore((s) => s.isPremium)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (isPremiumFeature && !isPremium) {
      router.push('/paywall')
    } else {
      router.push(route as Parameters<typeof router.push>[0])
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={handlePress}
    >
      <View style={styles.top}>
        <Text style={styles.emoji}>{emoji}</Text>
        {isPremiumFeature && !isPremium && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PREMIUM</Text>
          </View>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  )
})

export default FeatureCard

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#13131A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    gap: 4,
  },
  cardPressed: {
    backgroundColor: '#1C1C28',
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  emoji: {
    fontSize: 24,
  },
  badge: {
    backgroundColor: '#FFD70022',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFD70044',
  },
  badgeText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 9,
    color: '#FFD700',
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#8888AA',
    lineHeight: 15,
  },
})
