import { memo, useEffect, useState } from 'react'
import { Animated, Pressable, Share, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { captureRef } from 'react-native-view-shot'
import type React from 'react'

export type ShareMode = 'counter' | 'value' | 'meeting' | 'negative' | 'compare'

interface Props {
  mode?: ShareMode
  targetRef?: React.RefObject<View | null>
  customData?: Record<string, unknown>
  onPress?: () => void
}

function shareMessage(mode: ShareMode | undefined): string {
  switch (mode) {
    case 'meeting':
      return `Le coût de ma réunion calculé en temps réel 💸 WealthClock — wealthclock.app`
    case 'negative':
      return `Mon temps libre valorisé en euros 📉 WealthClock — wealthclock.app`
    case 'value':
      return `Ce produit m'a coûté combien de minutes de travail ? WealthClock — wealthclock.app`
    case 'compare':
      return `Mon salaire vs les autres en temps réel 💰 WealthClock — wealthclock.app`
    default:
      return `Découvre WealthClock — vois en direct combien tu gagnes à la seconde 💸 wealthclock.app`
  }
}

const ShareButton = memo(function ShareButton({ mode, targetRef, onPress }: Props) {
  const [sharing, setSharing] = useState(false)
  const [pulse] = useState(() => new Animated.Value(1))

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 2500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2500, useNativeDriver: true }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [pulse])

  const handlePress = async () => {
    if (sharing) return
    setSharing(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    if (!targetRef) {
      onPress?.()
      setSharing(false)
      return
    }

    try {
      const uri = await captureRef(targetRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      })

      await Share.share({ url: uri, message: shareMessage(mode) })

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      // User cancelled or capture failed — nothing to surface
    } finally {
      setSharing(false)
    }
  }

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: pulse }] }]}>
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={handlePress}
        accessibilityLabel="Partager"
        disabled={sharing}
      >
        <View style={styles.icon}>
          <Animated.Text style={styles.iconText}>↗</Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  )
})

export default ShareButton

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00FF87',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00FF87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPressed: {
    backgroundColor: '#00CC6A',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
    color: '#0A0A0F',
    fontWeight: '700',
  },
})
