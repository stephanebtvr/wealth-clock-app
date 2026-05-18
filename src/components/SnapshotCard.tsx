import { forwardRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { SnapshotData } from '../utils/snapshotGenerator'
import { formatCurrency, formatCurrencyCompact } from '../utils/formatCurrency'

interface Props {
  data: SnapshotData
  width: number
}

interface StatBlockProps {
  label: string
  value: string
}

function StatBlock({ label, value }: StatBlockProps) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

const SnapshotCard = forwardRef<View, Props>(function SnapshotCard({ data, width }, ref) {
  const height = Math.round(width * (1920 / 1080))

  const date = new Date(data.generatedAt)
  const dateStr = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <View ref={ref} collapsable={false} style={{ width, height, overflow: 'hidden' }}>
      <LinearGradient
        colors={['#0A0A0F', '#1C1C28', '#0A0A0F']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Grain overlay */}
      <View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.03)' }]}
        pointerEvents="none"
      />

      <View style={[styles.content, { width, height }]}>
        {/* Watermark logo */}
        <Text style={styles.watermark}>WEALTHCLOCK</Text>

        {/* Rate per second — hero element */}
        <View style={styles.rateSection}>
          <Text style={styles.rateLabel}>CHAQUE SECONDE TU GAGNES</Text>
          <Text style={styles.rateValue}>+{formatCurrency(data.secondRate, 4)}</Text>
          <Text style={styles.rateSubLabel}>
            {formatCurrency(data.minuteRate, 2)}/min · {formatCurrency(data.hourlyRate, 2)}/h
          </Text>
        </View>

        {/* 2×2 stats grid */}
        <View style={styles.grid}>
          <StatBlock label="Aujourd'hui" value={formatCurrency(data.todayEarnings, 2)} />
          <StatBlock label="Cette semaine" value={formatCurrencyCompact(data.weekEarnings)} />
          <StatBlock label="Ce mois" value={formatCurrencyCompact(data.monthEarnings)} />
          <StatBlock label="Cette année" value={formatCurrencyCompact(data.yearEarnings)} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.datetime}>
            {dateStr} · {timeStr}
          </Text>
          <Text style={styles.cta}>Calcule le tien → wealthclock.app</Text>
        </View>
      </View>
    </View>
  )
})

export default SnapshotCard

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },

  // Logo
  watermark: {
    fontFamily: 'Outfit-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 4,
    opacity: 0.5,
  },

  // Rate hero
  rateSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  rateLabel: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#8888AA',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  rateValue: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 48,
    color: '#00FF87',
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
    textAlign: 'center',
  },
  rateSubLabel: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#44445A',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },

  // Stats grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBlock: {
    width: '47%',
    backgroundColor: '#13131A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    padding: 16,
    gap: 6,
  },
  statLabel: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#8888AA',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },

  // Footer
  footer: {
    gap: 8,
    alignItems: 'center',
  },
  datetime: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#44445A',
    textAlign: 'center',
  },
  cta: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
