import { useCallback, useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import MeetingCounter from '@/components/MeetingCounter'
import { useMeetingCounter, type MeetingConfig } from '@/hooks/useMeetingCounter'
import { useWealthStore } from '@/store/wealthStore'
import { validateParticipants } from '@/utils/validators'
import { formatCurrency } from '@/utils/formatCurrency'
import { SMIC_ANNUAL, MEDIAN_SALARY_FRANCE } from '@/utils/constants'

type Phase = 'config' | 'active' | 'reveal'

const SALARY_PRESETS = [
  { label: 'SMIC', value: SMIC_ANNUAL },
  { label: 'Médian', value: MEDIAN_SALARY_FRANCE },
  { label: 'Cadre', value: 55_000 },
]

const REVEAL_COMPARISONS = [
  { emoji: '🍕', label: 'repas', price: 12 },
  { emoji: '📺', label: 'Netflix/mois', price: 5.99 },
  { emoji: '📱', label: 'iPhones', price: 1_299 },
]

function formatElapsed(seconds: number): string {
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3_600)
  const m = Math.floor((total % 3_600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min ${String(s).padStart(2, '0')}s`
  return `${String(m).padStart(2, '0')}min ${String(s).padStart(2, '0')}s`
}

export default function MeetingScreen() {
  const router = useRouter()
  const { salary, startMeeting, stopMeeting } = useWealthStore()

  const [phase, setPhase] = useState<Phase>('config')
  const [participants, setParticipants] = useState(3)
  const [averageSalary, setAverageSalary] = useState(salary ?? MEDIAN_SALARY_FRANCE)
  const [meetingConfig, setMeetingConfig] = useState<MeetingConfig | null>(null)

  const { costRef, elapsedSecondsRef, currentCost, elapsedSeconds, isRunning, pause, resume, stop } =
    useMeetingCounter(meetingConfig)

  const handleStart = useCallback(() => {
    Keyboard.dismiss()
    startMeeting(participants)
    const config: MeetingConfig = {
      participants,
      averageSalary,
      startedAt: Date.now(),
    }
    setMeetingConfig(config)
    setPhase('active')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  }, [participants, averageSalary, startMeeting])

  const handleStop = useCallback(() => {
    stop()
    stopMeeting()
    setPhase('reveal')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  }, [stop, stopMeeting])

  const handleNewMeeting = useCallback(() => {
    setMeetingConfig(null)
    setPhase('config')
  }, [])

  const adjustParticipants = useCallback(
    (delta: number) => {
      const next = participants + delta
      const val = validateParticipants(next)
      if (val.ok) {
        setParticipants(val.value)
        Haptics.selectionAsync()
      }
    },
    [participants]
  )

  // ─── CONFIG phase ──────────────────────────────────────────────────────────
  if (phase === 'config') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <Text style={styles.back}>← Retour</Text>
              </Pressable>
              <Text style={styles.title}>Mode Réunion</Text>
              <Text style={styles.subtitle}>Combien coûte vraiment cette réunion ?</Text>
            </View>

            {/* Participant count */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PARTICIPANTS</Text>
              <View style={styles.counterRow}>
                <Pressable
                  style={({ pressed }) => [styles.counterBtn, pressed && styles.counterBtnPressed]}
                  onPress={() => adjustParticipants(-1)}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </Pressable>
                <Text style={styles.counterValue}>{participants}</Text>
                <Pressable
                  style={({ pressed }) => [styles.counterBtn, pressed && styles.counterBtnPressed]}
                  onPress={() => adjustParticipants(1)}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Salary preset */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SALAIRE MOYEN PAR PERSONNE</Text>
              <View style={styles.chipRow}>
                {salary && (
                  <Pressable
                    style={[styles.chip, averageSalary === salary && styles.chipActive]}
                    onPress={() => {
                      setAverageSalary(salary)
                      Haptics.selectionAsync()
                    }}
                  >
                    <Text style={[styles.chipText, averageSalary === salary && styles.chipTextActive]}>
                      Mon salaire
                    </Text>
                  </Pressable>
                )}
                {SALARY_PRESETS.map((p) => (
                  <Pressable
                    key={p.label}
                    style={[styles.chip, averageSalary === p.value && styles.chipActive]}
                    onPress={() => {
                      setAverageSalary(p.value)
                      Haptics.selectionAsync()
                    }}
                  >
                    <Text
                      style={[styles.chipText, averageSalary === p.value && styles.chipTextActive]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.salaryHint}>{formatCurrency(averageSalary, 0)}/an</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
              onPress={handleStart}
            >
              <Text style={styles.startBtnText}>Lancer la réunion</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  // ─── ACTIVE phase ──────────────────────────────────────────────────────────
  if (phase === 'active') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.activeContainer}>
          <View style={styles.activeHeader}>
            <Text style={styles.activeMeta}>
              {participants} participant{participants > 1 ? 's' : ''} · {formatCurrency(averageSalary, 0)}/an
            </Text>
          </View>

          <View style={styles.activeCounter}>
            <Text style={styles.activeLabel}>COÛT EN DIRECT</Text>
            <MeetingCounter
              costRef={costRef}
              elapsedSecondsRef={elapsedSecondsRef}
              isRunning={isRunning}
            />
          </View>

          <View style={styles.activeActions}>
            <Pressable
              style={({ pressed }) => [styles.pauseBtn, pressed && styles.pauseBtnPressed]}
              onPress={() => {
                if (isRunning) pause()
                else resume()
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }}
            >
              <Text style={styles.pauseBtnText}>{isRunning ? '⏸ Pause' : '▶ Reprendre'}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.stopBtn, pressed && styles.stopBtnPressed]}
              onPress={handleStop}
            >
              <Text style={styles.stopBtnText}>Terminer</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  // ─── REVEAL phase ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.revealContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.revealTitle}>Cette réunion a coûté</Text>
        <Text style={styles.revealCost}>{formatCurrency(currentCost, 2)}</Text>
        <Text style={styles.revealDuration}>{formatElapsed(elapsedSeconds)}</Text>
        <Text style={styles.revealMeta}>
          {participants} participant{participants > 1 ? 's' : ''} · {formatCurrency(averageSalary, 0)}/an
        </Text>

        {/* Comparisons */}
        <View style={styles.comparisons}>
          <Text style={styles.comparisonsTitle}>Ça aurait pu payer…</Text>
          {REVEAL_COMPARISONS.map((c) => {
            const count = currentCost / c.price
            return (
              <View key={c.label} style={styles.comparisonRow}>
                <Text style={styles.comparisonEmoji}>{c.emoji}</Text>
                <Text style={styles.comparisonCount}>
                  {count >= 1_000
                    ? `${(count / 1_000).toFixed(1)}k`
                    : count >= 10
                    ? Math.round(count).toLocaleString('fr-FR')
                    : count.toFixed(1)}
                </Text>
                <Text style={styles.comparisonLabel}>{c.label}</Text>
              </View>
            )
          })}
        </View>

        <Pressable
          style={({ pressed }) => [styles.newMeetingBtn, pressed && styles.newMeetingBtnPressed]}
          onPress={handleNewMeeting}
        >
          <Text style={styles.newMeetingBtnText}>Nouvelle réunion</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.closeBtnText}>Fermer</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },

  // Header
  header: {
    paddingTop: 8,
    gap: 6,
  },
  back: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#8888AA',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Outfit-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#8888AA',
  },

  // Config sections
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontFamily: 'Outfit-Bold',
    fontSize: 11,
    color: '#44445A',
    letterSpacing: 1.5,
  },

  // Participant counter
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  counterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#13131A',
    borderWidth: 1,
    borderColor: '#1E1E2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnPressed: {
    backgroundColor: '#1C1C28',
    borderColor: '#00FF87',
  },
  counterBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    lineHeight: 28,
  },
  counterValue: {
    fontFamily: 'Outfit-Bold',
    fontSize: 52,
    color: '#FFFFFF',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    minWidth: 60,
    textAlign: 'center',
  },

  // Salary chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#13131A',
    borderWidth: 1,
    borderColor: '#1E1E2E',
  },
  chipActive: {
    backgroundColor: '#001A0D',
    borderColor: '#00FF87',
  },
  chipText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
    color: '#8888AA',
  },
  chipTextActive: {
    color: '#00FF87',
  },
  salaryHint: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#44445A',
  },

  // Start button
  startBtn: {
    backgroundColor: '#FF4444',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnPressed: {
    backgroundColor: '#CC0000',
  },
  startBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Active phase
  activeContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  activeHeader: {
    paddingTop: 12,
    alignItems: 'center',
  },
  activeMeta: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#8888AA',
  },
  activeCounter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  activeLabel: {
    fontFamily: 'Outfit-Bold',
    fontSize: 11,
    color: '#CC0000',
    letterSpacing: 2,
  },
  activeActions: {
    gap: 12,
  },
  pauseBtn: {
    backgroundColor: '#13131A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E2E',
  },
  pauseBtnPressed: {
    backgroundColor: '#1C1C28',
    borderColor: '#8888AA',
  },
  pauseBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 15,
    color: '#8888AA',
  },
  stopBtn: {
    backgroundColor: '#FF4444',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  stopBtnPressed: {
    backgroundColor: '#CC0000',
  },
  stopBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Reveal phase
  revealContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
  },
  revealTitle: {
    fontFamily: 'Outfit',
    fontSize: 16,
    color: '#8888AA',
  },
  revealCost: {
    fontFamily: 'Outfit-Bold',
    fontSize: 52,
    color: '#FF4444',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  revealDuration: {
    fontFamily: 'Outfit-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  revealMeta: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#44445A',
    marginBottom: 8,
  },

  // Comparisons
  comparisons: {
    width: '100%',
    backgroundColor: '#13131A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    gap: 16,
    marginTop: 8,
  },
  comparisonsTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
    color: '#44445A',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  comparisonEmoji: {
    fontSize: 28,
    width: 36,
  },
  comparisonCount: {
    fontFamily: 'Outfit-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
    minWidth: 80,
  },
  comparisonLabel: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#8888AA',
    flex: 1,
  },

  // Reveal buttons
  newMeetingBtn: {
    width: '100%',
    backgroundColor: '#13131A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E1E2E',
    marginTop: 16,
  },
  newMeetingBtnPressed: {
    backgroundColor: '#1C1C28',
    borderColor: '#FF4444',
  },
  newMeetingBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 15,
    color: '#8888AA',
  },
  closeBtn: {
    paddingVertical: 12,
  },
  closeBtnPressed: {
    opacity: 0.6,
  },
  closeBtnText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#44445A',
    textAlign: 'center',
  },
})
