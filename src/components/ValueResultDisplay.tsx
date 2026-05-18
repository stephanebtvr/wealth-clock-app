import React, { memo, useEffect, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import type { ValueResult } from '../types'
import { WORKING_HOURS_PER_DAY } from '../utils/constants'

interface Props {
  result: ValueResult
}

// Max reference for the progress bar: 1 full work day
const WORK_MINUTES_PER_DAY = WORKING_HOURS_PER_DAY * 60

const ValueResultDisplay = memo(function ValueResultDisplay({ result }: Props) {
  const [slideAnim] = useState(() => new Animated.Value(30))
  const [opacityAnim] = useState(() => new Animated.Value(0))
  const [barAnim] = useState(() => new Animated.Value(0))

  // Progress: capped at 1 full work day for bar display
  const progress = Math.min(result.workMinutes / WORK_MINUTES_PER_DAY, 1)

  useEffect(() => {
    // Reset then animate in when result changes
    slideAnim.setValue(30)
    opacityAnim.setValue(0)
    barAnim.setValue(0)

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(barAnim, {
        toValue: progress,
        duration: 500,
        delay: 150,
        useNativeDriver: false,
      }),
    ]).start()
  }, [result, slideAnim, opacityAnim, barAnim, progress])

  return (
    <Animated.View
      style={[styles.card, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}
    >
      {/* Emoji + label */}
      <View style={styles.topRow}>
        <Text style={styles.emoji}>{result.emoji}</Text>
        <View style={styles.labelBlock}>
          <Text style={styles.timeLabel}>{result.label}</Text>
          <Text style={styles.comparison}>{result.comparison}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: barAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.barCaption}>
        {progress >= 1 ? '> 1 journée de travail' : `${Math.round(progress * 100)}% d'une journée`}
      </Text>

      {/* Detail row */}
      <View style={styles.detailRow}>
        <DetailPill label="minutes" value={Math.round(result.workMinutes)} />
        <DetailPill label="heures" value={parseFloat(result.workHours.toFixed(2))} />
        <DetailPill label="jours" value={parseFloat(result.workDays.toFixed(2))} />
      </View>
    </Animated.View>
  )
})

function DetailPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{String(value).replace('.', ',')}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  )
}

export default ValueResultDisplay

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#13131A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emoji: {
    fontSize: 40,
  },
  labelBlock: {
    flex: 1,
    gap: 4,
  },
  timeLabel: {
    fontFamily: 'Outfit-Bold',
    fontSize: 28,
    color: '#00FF87',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  comparison: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#8888AA',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#1E1E2E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    backgroundColor: '#00FF87',
    borderRadius: 3,
  },
  barCaption: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#44445A',
    textAlign: 'right',
    marginTop: -8,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E2E',
    gap: 2,
  },
  pillValue: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  pillLabel: {
    fontFamily: 'Outfit',
    fontSize: 10,
    color: '#44445A',
  },
})
