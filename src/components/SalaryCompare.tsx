import { memo, useEffect, useRef } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import type { SalaryProfile } from '../types'
import { secondRate, todayEarnings } from '../utils/salaryCalculator'
import { formatCurrency } from '../utils/formatCurrency'
import { COUNTER_INTERVAL_MS } from '../utils/constants'

interface Props {
  profiles: SalaryProfile[]
  userSalary: number | null
}

// Log-scale font size: SMIC≈24px, Médian≈28px, Dev≈32px, Mbappé=64px
const SCALE_POINTS: [number, number][] = [
  [21_203, 24],
  [26_500, 28],
  [58_000, 32],
  [72_000_000, 64],
]

function getCounterFontSize(salary: number): number {
  const logSalary = Math.log10(Math.max(1, salary))
  for (let i = 1; i < SCALE_POINTS.length; i++) {
    const [s0, f0] = SCALE_POINTS[i - 1]
    const [s1, f1] = SCALE_POINTS[i]
    const l0 = Math.log10(s0)
    const l1 = Math.log10(s1)
    if (logSalary <= l1) {
      const t = l1 > l0 ? (logSalary - l0) / (l1 - l0) : 0
      return Math.round(f0 + (f1 - f0) * Math.max(0, Math.min(1, t)))
    }
  }
  return 64
}

function formatRatio(ratio: number): string {
  if (ratio >= 100_000) return `${Math.round(ratio / 1_000).toLocaleString('fr-FR')}k`
  if (ratio >= 1_000) return Math.round(ratio).toLocaleString('fr-FR')
  if (ratio >= 10) return Math.round(ratio).toLocaleString('fr-FR')
  return ratio.toFixed(1).replace('.', ',')
}

const SalaryCompare = memo(function SalaryCompare({ profiles, userSalary }: Props) {
  const displayRefsRef = useRef<{ [id: string]: TextInput | null }>({})
  const accumulatedRef = useRef<{ [id: string]: number }>({})

  useEffect(() => {
    profiles.forEach((p) => {
      accumulatedRef.current[p.id] = todayEarnings(p.annualSalary)
    })

    if (!profiles.length) return

    // ONE setInterval for all N profiles — avoids N concurrent intervals
    const id = setInterval(() => {
      profiles.forEach((p) => {
        const prev = accumulatedRef.current[p.id] ?? 0
        accumulatedRef.current[p.id] = prev + secondRate(p.annualSalary) / 10
        displayRefsRef.current[p.id]?.setNativeProps({
          text: formatCurrency(accumulatedRef.current[p.id], 2),
        })
      })
    }, COUNTER_INTERVAL_MS)

    return () => clearInterval(id)
  }, [profiles])

  if (!profiles.length) return null

  return (
    <View style={styles.container}>
      {profiles.map((profile) => {
        const fontSize = getCounterFontSize(profile.annualSalary)
        const ratio =
          userSalary && userSalary > 0 ? profile.annualSalary / userSalary : null

        return (
          <View key={profile.id} style={styles.profileRow}>
            <View style={styles.meta}>
              <Text style={styles.emoji}>{profile.emoji}</Text>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {profile.name}
                </Text>
                {ratio !== null && ratio >= 1 && (
                  <Text style={styles.ratioAbove}>
                    {formatRatio(ratio)}× plus que toi
                  </Text>
                )}
                {ratio !== null && ratio < 1 && (
                  <Text style={styles.ratioBelow}>
                    {formatRatio(1 / ratio)}× moins que toi
                  </Text>
                )}
              </View>
            </View>
            <TextInput
              ref={(ref) => {
                displayRefsRef.current[profile.id] = ref
              }}
              style={[styles.counter, { fontSize, lineHeight: fontSize * 1.1 }]}
              defaultValue={formatCurrency(0, 2)}
              editable={false}
              caretHidden
            />
          </View>
        )
      })}
    </View>
  )
})

export default SalaryCompare

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  profileRow: {
    backgroundColor: '#13131A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    padding: 14,
    gap: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emoji: {
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  ratioAbove: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#00FF87',
  },
  ratioBelow: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#FF4444',
  },
  counter: {
    fontFamily: 'SpaceMono-Bold',
    color: '#00FF87',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
})
