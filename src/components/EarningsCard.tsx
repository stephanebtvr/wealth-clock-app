import React, { memo, useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'
import { formatCurrency } from '../utils/formatCurrency'

interface Props {
  label: string
  amount: number
}

const EarningsCard = memo(function EarningsCard({ label, amount }: Props) {
  const slideAnim = useRef(new Animated.Value(24)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start()
  }, [slideAnim, opacityAnim])

  return (
    <Animated.View
      style={[
        styles.card,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.amount}>{formatCurrency(amount, 2)}</Text>
    </Animated.View>
  )
})

export default EarningsCard

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#13131A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    gap: 6,
  },
  label: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#8888AA',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amount: {
    fontFamily: 'Outfit-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
})
