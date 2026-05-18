import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useWealthStore } from '@/store/wealthStore'
import { useNegativeCounter, type NegativeConfig } from '@/hooks/useNegativeCounter'
import NegativeCounter from '@/components/NegativeCounter'
import { formatCurrency } from '@/utils/formatCurrency'
import { WORKING_DAYS_PER_YEAR, COUNTER_INTERVAL_MS } from '@/utils/constants'
import type { NegativeActivityType } from '@/types'

// ─── Activity definitions ──────────────────────────────────────────────────────

interface ActivityDef {
  type: NegativeActivityType
  emoji: string
  label: string
  durationMinutes?: number
}

const ACTIVITIES: ActivityDef[] = [
  { type: 'netflix_episode', emoji: '🎬', label: 'Épisode Netflix', durationMinutes: 45 },
  { type: 'netflix_movie', emoji: '🍿', label: 'Film Netflix', durationMinutes: 120 },
  { type: 'tiktok_scroll', emoji: '📱', label: 'TikTok Scroll' },
  { type: 'commute', emoji: '🚇', label: 'Trajet', durationMinutes: 45 },
  { type: 'gym', emoji: '💪', label: 'Salle de sport', durationMinutes: 60 },
  { type: 'cooking', emoji: '👨‍🍳', label: 'Cuisine', durationMinutes: 45 },
  { type: 'shopping', emoji: '🛍️', label: 'Shopping', durationMinutes: 90 },
  { type: 'custom', emoji: '⏱️', label: 'Personnalisé' },
]

// ─── Fun facts ─────────────────────────────────────────────────────────────────

function buildFacts(loss: number, annualSalary: number): [string, string, string] {
  const dailySalary = annualSalary / WORKING_DAYS_PER_YEAR
  const pct =
    dailySalary > 0
      ? ((loss / dailySalary) * 100).toFixed(1).replace('.', ',')
      : '0,0'
  const repas = (loss / 14).toFixed(1).replace('.', ',')
  const essence = (loss / 1.8).toFixed(1).replace('.', ',')
  return [
    `📊 ${pct}% de ton salaire journalier`,
    `🍽️ Équivalent ${repas} repas au restaurant`,
    `⛽ Soit ${essence}L d'essence`,
  ]
}

type Phase = 'select' | 'active' | 'reveal'

export default function NegativeTimeScreen() {
  const router = useRouter()
  const { salary, startNegativeActivity, stopNegativeActivity } = useWealthStore()

  const [phase, setPhase] = useState<Phase>('select')
  const [activity, setActivity] = useState<ActivityDef | null>(null)
  const [config, setConfig] = useState<NegativeConfig | null>(null)

  const [factIndex, setFactIndex] = useState(0)
  const [factOpacity] = useState(() => new Animated.Value(1))
  const [factLoss, setFactLoss] = useState(0)

  const { lossRef, elapsedSecondsRef, currentLoss, elapsedSeconds, isRunning, stop } =
    useNegativeCounter(config)

  // Tiktok meta message — setNativeProps every second
  const metaRef = useRef<TextInput>(null)
  useEffect(() => {
    if (activity?.type !== 'tiktok_scroll' || !isRunning) return
    const id = setInterval(() => {
      metaRef.current?.setNativeProps({
        text: `🤭 Ironique... cette vidéo t'a déjà coûté ${formatCurrency(lossRef.current, 2)}`,
      })
    }, COUNTER_INTERVAL_MS)
    return () => clearInterval(id)
  }, [activity?.type, isRunning, lossRef])

  // Rotating fun facts (cross-fade every 5s)
  useEffect(() => {
    if (phase !== 'active') return
    const id = setInterval(() => {
      Animated.timing(factOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setFactLoss(lossRef.current)
        setFactIndex((i) => (i + 1) % 3)
        Animated.timing(factOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start()
      })
    }, 5_000)
    return () => clearInterval(id)
  }, [phase, factOpacity, lossRef])

  const handleSelectActivity = useCallback(
    (def: ActivityDef) => {
      Haptics.selectionAsync()
      const newConfig: NegativeConfig = {
        activityType: def.type,
        annualSalary: salary ?? 0,
        startedAt: Date.now(),
        durationMinutes: def.durationMinutes,
      }
      setActivity(def)
      setConfig(newConfig)
      setFactLoss(def.durationMinutes ? (salary ?? 0) / WORKING_DAYS_PER_YEAR / 8 * def.durationMinutes / 60 : 0)
      setFactIndex(0)
      startNegativeActivity(def.type, def.durationMinutes)
      setPhase('active')
    },
    [salary, startNegativeActivity]
  )

  const handleStop = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    stop()
    stopNegativeActivity()
    setPhase('reveal')
  }, [stop, stopNegativeActivity])

  const handleReset = useCallback(() => {
    setPhase('select')
    setActivity(null)
    setConfig(null)
    setFactIndex(0)
    setFactLoss(0)
  }, [])

  const facts = buildFacts(factLoss, salary ?? 0)
  const revealFacts = buildFacts(currentLoss, salary ?? 0)

  const formatElapsed = (secs: number): string => {
    const total = Math.floor(secs)
    const h = Math.floor(total / 3_600)
    const m = Math.floor((total % 3_600) / 60)
    const s = total % 60
    if (h > 0) return `${h}h ${m}min ${s}s`
    if (m > 0) return `${m} min ${s}s`
    return `${s} secondes`
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── SELECT ─────────────────────────────────────────────── */}
      {phase === 'select' && (
        <ScrollView
          contentContainerStyle={styles.selectContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.back}>← Retour</Text>
            </Pressable>
            <Text style={styles.title}>Temps libre en négatif</Text>
            <Text style={styles.subtitle}>
              Combien vaut ton temps libre ?
            </Text>
          </View>

          <View style={styles.grid}>
            {ACTIVITIES.map((def) => (
              <Pressable
                key={def.type}
                style={({ pressed }) => [styles.activityCard, pressed && styles.activityCardPressed]}
                onPress={() => handleSelectActivity(def)}
              >
                <Text style={styles.activityEmoji}>{def.emoji}</Text>
                <Text style={styles.activityLabel}>{def.label}</Text>
                <Text style={styles.activityDuration}>
                  {def.durationMinutes ? `${def.durationMinutes} min` : 'En direct'}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── ACTIVE ─────────────────────────────────────────────── */}
      {phase === 'active' && activity && (
        <View style={styles.activeContainer}>
          <View style={styles.header}>
            <Pressable onPress={handleStop} hitSlop={12}>
              <Text style={styles.back}>← Annuler</Text>
            </Pressable>
            <Text style={styles.activityTitle}>
              {activity.emoji} {activity.label}
            </Text>
            {activity.durationMinutes && (
              <Text style={styles.activityDurationLabel}>{activity.durationMinutes} minutes</Text>
            )}
          </View>

          <View style={styles.counterSection}>
            <NegativeCounter lossRef={lossRef} elapsedSecondsRef={elapsedSecondsRef} />
          </View>

          {/* Tiktok meta message */}
          {activity.type === 'tiktok_scroll' && (
            <TextInput
              ref={metaRef}
              style={styles.metaMessage}
              defaultValue="🤭 Ironique... cette vidéo t'a déjà coûté 0,00 €"
              editable={false}
              multiline
            />
          )}

          {/* Rotating fun fact */}
          <Animated.View style={[styles.factCard, { opacity: factOpacity }]}>
            <Text style={styles.factText}>{facts[factIndex]}</Text>
          </Animated.View>

          {/* STOP button */}
          <Pressable
            style={({ pressed }) => [styles.stopBtn, pressed && styles.stopBtnPressed]}
            onPress={handleStop}
          >
            <Text style={styles.stopBtnText}>STOP</Text>
          </Pressable>
        </View>
      )}

      {/* ── REVEAL ─────────────────────────────────────────────── */}
      {phase === 'reveal' && activity && (
        <ScrollView
          contentContainerStyle={styles.revealContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.revealTitle}>Tu viens de perdre</Text>
          </View>

          <View style={styles.revealAmountCard}>
            <Text style={styles.revealAmount}>
              −{formatCurrency(currentLoss, 2)}
            </Text>
            <Text style={styles.revealDuration}>
              {activity.emoji} {activity.label} — {formatElapsed(elapsedSeconds)}
            </Text>
          </View>

          <View style={styles.revealFactsCard}>
            {revealFacts.map((fact) => (
              <Text key={fact} style={styles.revealFact}>
                {fact}
              </Text>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.newActivityBtn, pressed && styles.newActivityBtnPressed]}
            onPress={handleReset}
          >
            <Text style={styles.newActivityBtnText}>Nouvelle activité</Text>
          </Pressable>

          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.closeBtn}>Fermer</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 4,
    marginBottom: 8,
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

  // SELECT phase
  selectContent: {
    paddingBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 8,
  },
  activityCard: {
    width: '47.5%',
    backgroundColor: '#13131A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  activityCardPressed: {
    backgroundColor: '#1A1010',
    borderColor: '#FF444466',
  },
  activityEmoji: {
    fontSize: 32,
  },
  activityLabel: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  activityDuration: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#8888AA',
  },

  // ACTIVE phase
  activeContainer: {
    flex: 1,
    paddingBottom: 32,
  },
  activityTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  activityDurationLabel: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#8888AA',
  },
  counterSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 4,
  },
  metaMessage: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#FF8888',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
    lineHeight: 22,
  },
  factCard: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#13131A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FF444422',
    padding: 16,
  },
  factText: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#8888AA',
    lineHeight: 20,
    textAlign: 'center',
  },
  stopBtn: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#FF4444',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  stopBtnPressed: {
    backgroundColor: '#CC0000',
  },
  stopBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 2,
  },

  // REVEAL phase
  revealContent: {
    paddingBottom: 48,
    gap: 16,
  },
  revealTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  revealAmountCard: {
    marginHorizontal: 20,
    backgroundColor: '#1A0A0A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF444444',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  revealAmount: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 72,
    color: '#FF4444',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  revealDuration: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#8888AA',
    textAlign: 'center',
  },
  revealFactsCard: {
    marginHorizontal: 20,
    backgroundColor: '#13131A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    padding: 20,
    gap: 12,
  },
  revealFact: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  newActivityBtn: {
    marginHorizontal: 20,
    backgroundColor: '#FF4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  newActivityBtnPressed: {
    backgroundColor: '#CC0000',
  },
  newActivityBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  closeBtn: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#8888AA',
    textAlign: 'center',
    paddingVertical: 8,
  },
})
