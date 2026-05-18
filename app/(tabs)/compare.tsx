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
import { SafeAreaView } from 'react-native-safe-area-context'
import { useWealthStore } from '@/store/wealthStore'
import { useEarningsCounter } from '@/hooks/useEarningsCounter'
import { SALARY_PROFILES, getProfilesByCategory } from '@/utils/salaryProfiles'
import { formatCurrency } from '@/utils/formatCurrency'
import { COUNTER_INTERVAL_MS } from '@/utils/constants'
import SalaryCompare from '@/components/SalaryCompare'
import type { SalaryProfile } from '@/types'

type Category = SalaryProfile['category']

const TABS: { key: Category; label: string }[] = [
  { key: 'reference', label: 'Références' },
  { key: 'profession', label: 'Professions' },
  { key: 'celebrity', label: 'Célébrités' },
  { key: 'ceo', label: 'CEO' },
]

const FUN_FACTS = [
  "💡 Mbappé gagne en 1h ce qu'un SMIC touche en 1 mois",
  '💡 Les PDG du CAC 40 gagnent en moyenne 104× leur salarié médian',
  "💡 Carlos Tavares gagne autant que 1 700 salariés au SMIC",
  "💡 Bernard Arnault gagne en 4 min ce qu'un SMIC touche en 1 an",
  "💡 Un pilote de ligne gagne 4× plus qu'un infirmier",
  '💡 En France, les 1% captent 14× le salaire médian',
]

const MAX_SELECTED = 3

function formatSalaryShort(annual: number): string {
  if (annual >= 1_000_000) return `${(annual / 1_000_000).toFixed(1).replace('.', ',')}M€/an`
  return `${Math.round(annual / 1_000)}k€/an`
}

export default function CompareScreen() {
  const salary = useWealthStore((s) => s.salary)
  const { accumulatedRef } = useEarningsCounter()
  const miniCounterRef = useRef<TextInput>(null)

  const [activeTab, setActiveTab] = useState<Category>('reference')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [factIndex, setFactIndex] = useState(0)
  const [factOpacity] = useState(() => new Animated.Value(1))

  useEffect(() => {
    const id = setInterval(() => {
      miniCounterRef.current?.setNativeProps({
        text: formatCurrency(accumulatedRef.current, 2),
      })
    }, COUNTER_INTERVAL_MS)
    return () => clearInterval(id)
  }, [accumulatedRef])

  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(factOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setFactIndex((i) => (i + 1) % FUN_FACTS.length)
        Animated.timing(factOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start()
      })
    }, 10_000)
    return () => clearInterval(id)
  }, [factOpacity])

  const profiles = getProfilesByCategory(activeTab)

  const selectedProfiles = selectedIds
    .map((id) => SALARY_PROFILES.find((p) => p.id === id))
    .filter((p): p is SalaryProfile => !!p)

  const toggleProfile = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= MAX_SELECTED) return prev
      return [...prev, id]
    })
  }, [])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Comparateur</Text>
          <Text style={styles.subtitle}>Sélectionne jusqu'à 3 profils</Text>
        </View>

        {/* Personal mini-counter */}
        {salary ? (
          <View style={styles.myCard}>
            <Text style={styles.myLabel}>Toi aujourd'hui</Text>
            <TextInput
              ref={miniCounterRef}
              style={styles.myCounter}
              defaultValue={formatCurrency(0, 2)}
              editable={false}
              caretHidden
            />
          </View>
        ) : null}

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Selection count badge */}
        {selectedIds.length > 0 && (
          <View style={styles.selectionRow}>
            <Text style={styles.selectionCount}>
              {selectedIds.length}/{MAX_SELECTED} sélectionné{selectedIds.length > 1 ? 's' : ''}
            </Text>
            <Pressable onPress={() => setSelectedIds([])}>
              <Text style={styles.clearBtn}>Effacer</Text>
            </Pressable>
          </View>
        )}

        {/* Profile grid */}
        <View style={styles.grid}>
          {profiles.map((profile) => {
            const isSelected = selectedIds.includes(profile.id)
            const isDisabled = !isSelected && selectedIds.length >= MAX_SELECTED
            return (
              <Pressable
                key={profile.id}
                style={[
                  styles.profileCard,
                  isSelected && styles.profileCardSelected,
                  isDisabled && styles.profileCardDisabled,
                ]}
                onPress={() => toggleProfile(profile.id)}
                disabled={isDisabled}
              >
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
                <Text style={styles.profileEmoji}>{profile.emoji}</Text>
                <Text style={styles.profileName} numberOfLines={2}>
                  {profile.name}
                </Text>
                <Text style={[styles.profileSalary, isSelected && styles.profileSalarySelected]}>
                  {formatSalaryShort(profile.annualSalary)}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Live comparison */}
        {selectedProfiles.length > 0 && (
          <View style={styles.compareSection}>
            <Text style={styles.sectionTitle}>Comparaison en direct</Text>
            <SalaryCompare profiles={selectedProfiles} userSalary={salary} />
          </View>
        )}

        {/* Rotating fun fact */}
        <Animated.View style={[styles.factCard, { opacity: factOpacity }]}>
          <Text style={styles.factText}>{FUN_FACTS[factIndex]}</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 4,
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

  // Personal counter card
  myCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#13131A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    padding: 16,
    gap: 4,
  },
  myLabel: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#8888AA',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  myCounter: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 28,
    color: '#00FF87',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },

  // Category tabs
  tabsScroll: {
    marginTop: 20,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#13131A',
    borderWidth: 1,
    borderColor: '#1E1E2E',
  },
  tabActive: {
    backgroundColor: '#00FF8722',
    borderColor: '#00FF87',
  },
  tabText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
    color: '#8888AA',
  },
  tabTextActive: {
    color: '#00FF87',
  },

  // Selection count
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  selectionCount: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#00FF87',
  },
  clearBtn: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#8888AA',
  },

  // Profile grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 10,
  },
  profileCard: {
    width: '47.5%',
    backgroundColor: '#13131A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    padding: 14,
    gap: 4,
    position: 'relative',
  },
  profileCardSelected: {
    borderColor: '#00FF87',
    backgroundColor: '#0D1F16',
  },
  profileCardDisabled: {
    opacity: 0.35,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00FF87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 11,
    color: '#0A0A0F',
    lineHeight: 14,
  },
  profileEmoji: {
    fontSize: 24,
  },
  profileName: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 4,
  },
  profileSalary: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#8888AA',
    fontVariant: ['tabular-nums'],
  },
  profileSalarySelected: {
    color: '#00FF8799',
  },

  // Live comparison
  compareSection: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Fun fact
  factCard: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: '#13131A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    padding: 16,
  },
  factText: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#8888AA',
    lineHeight: 20,
    textAlign: 'center',
  },
})
