import React, { memo } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import * as Haptics from 'expo-haptics'

interface Props {
  onPress?: () => void
}

// FAB — full share logic implemented in Étape 15
const ShareButton = memo(function ShareButton({ onPress }: Props) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onPress?.()
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
      onPress={handlePress}
      accessibilityLabel="Partager"
    >
      <Text style={styles.icon}>↗</Text>
    </Pressable>
  )
})

export default ShareButton

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
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
    fontSize: 22,
    color: '#0A0A0F',
    fontWeight: '700',
  },
})
