import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import CounterDisplay from '@/components/CounterDisplay'
import EarningsCard from '@/components/EarningsCard'
import FeatureCard from '@/components/FeatureCard'
import ShareButton from '@/components/ShareButton'
import { useEarningsCounter } from '@/hooks/useEarningsCounter'

const FEATURE_CARDS = [
  {
    emoji: '💰',
    title: 'Valeur réelle',
    subtitle: 'Combien coûte vraiment ce produit ?',
    route: '/value-scanner',
  },
  {
    emoji: '👥',
    title: 'Mode Réunion',
    subtitle: 'Coût en temps réel de votre réunion',
    route: '/meeting',
  },
  {
    emoji: '⏱️',
    title: 'Temps libre',
    subtitle: 'Ce que vous ne gagnez pas',
    route: '/negative-time',
  },
  {
    emoji: '📸',
    title: 'Mon Snapshot',
    subtitle: 'Template viral pour TikTok',
    route: '/snapshot',
  },
]

export default function HomeScreen() {
  const router = useRouter()
  const { accumulatedRef, accumulatedToday, secondRate, hourlyRate } = useEarningsCounter()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* ─ Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.appName}>WealthClock</Text>
          <Pressable
            onPress={() => router.push('/settings')}
            hitSlop={12}
            style={styles.settingsBtn}
          >
            <Text style={styles.settingsIcon}>⚙</Text>
          </Pressable>
        </View>

        {/* ─ Counter (always visible without scroll) ────────────────────── */}
        <View style={styles.counterSection}>
          <CounterDisplay accumulatedRef={accumulatedRef} secondRate={secondRate} />
          <Text style={styles.rateLabel}>
            {(secondRate * 3_600).toFixed(4).replace('.', ',')} €/heure
          </Text>
        </View>

        {/* ─ Earnings cards ─────────────────────────────────────────────── */}
        <View style={styles.earningsRow}>
          <EarningsCard label="Cette heure" amount={hourlyRate} />
          <EarningsCard label="Aujourd'hui" amount={accumulatedToday} />
        </View>

        {/* ─ Feature 2×2 grid ───────────────────────────────────────────── */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <FeatureCard {...FEATURE_CARDS[0]} />
            <FeatureCard {...FEATURE_CARDS[1]} />
          </View>
          <View style={styles.gridRow}>
            <FeatureCard {...FEATURE_CARDS[2]} />
            <FeatureCard {...FEATURE_CARDS[3]} />
          </View>
        </View>
      </View>

      {/* ─ FAB (absolutely positioned, above tab bar) ─────────────────── */}
      <ShareButton />
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
    paddingHorizontal: 16,
    // Space is distributed between sections via flex — fits SE without scroll
    justifyContent: 'space-between',
    paddingBottom: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 4,
  },
  appName: {
    fontFamily: 'Outfit-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  settingsBtn: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 20,
    color: '#8888AA',
  },

  // Counter section
  counterSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  rateLabel: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#44445A',
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },

  // Earnings cards row
  earningsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },

  // Feature cards grid
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
})
