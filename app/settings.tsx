import { useState } from 'react'
import {
  Alert,
  Linking,
  Modal,
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
import Constants from 'expo-constants'
import { useWealthStore } from '@/store/wealthStore'
import { useSecureStorage } from '@/hooks/useSecureStorage'
import { usePurchases } from '@/hooks/usePurchases'
import { validateSalary } from '@/utils/validators'
import type { CalcMode } from '@/types'

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0'

// ─── Section + Row helpers ────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

function Row({
  label,
  value,
  onPress,
  danger,
}: {
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </Pressable>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter()
  const salary = useWealthStore((s) => s.salary)
  const calcMode = useWealthStore((s) => s.calcMode)
  const isPremium = useWealthStore((s) => s.isPremium)
  const setSalary = useWealthStore((s) => s.setSalary)
  const setCalculationMode = useWealthStore((s) => s.setCalculationMode)
  const clearHistory = useWealthStore((s) => s.clearHistory)

  const { saveSalary } = useSecureStorage()
  const { restorePurchases } = usePurchases()

  const [editingSalary, setEditingSalary] = useState(false)
  const [salaryInput, setSalaryInput] = useState(salary?.toString() ?? '')
  const [salaryError, setSalaryError] = useState<string | null>(null)

  // Salary edit
  const openSalaryEdit = () => {
    setSalaryInput(salary?.toString() ?? '')
    setSalaryError(null)
    setEditingSalary(true)
  }

  const confirmSalaryEdit = async () => {
    const result = validateSalary(salaryInput)
    if (!result.ok) {
      setSalaryError(result.error)
      return
    }
    setSalary(result.value)
    await saveSalary(result.value)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setEditingSalary(false)
  }

  // Calc mode
  const toggleCalcMode = () => {
    const next: CalcMode = calcMode === 'work_only' ? 'annualized' : 'work_only'
    Haptics.selectionAsync()
    setCalculationMode(next)
  }

  const calcModeLabel = calcMode === 'work_only' ? 'Jours ouvrés (défaut)' : 'Annualisé 24/7'

  // Clear history
  const handleClearHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(
      "Vider l’historique",
      "Supprimer toutes les valeurs et tous les moments calculés ? Cette action est irréversible.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: () => {
            clearHistory()
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          },
        },
      ],
    )
  }

  // Restore purchases
  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await restorePurchases()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>← Retour</Text>
        </Pressable>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Salary */}
        <Section title="Mon salaire">
          <Row
            label="Salaire annuel brut"
            value={salary ? `${salary.toLocaleString('fr-FR')} €` : 'Non défini'}
            onPress={openSalaryEdit}
          />
          <Row
            label="Mode de calcul"
            value={calcModeLabel}
            onPress={toggleCalcMode}
          />
        </Section>

        {/* Premium */}
        <Section title="Premium">
          {isPremium ? (
            <Row label="Statut" value="✓ Premium actif" />
          ) : (
            <Row label="Déverrouiller Premium" onPress={() => router.push('/paywall')} />
          )}
          <Row label="Restaurer mes achats" onPress={handleRestore} />
        </Section>

        {/* Data */}
        <Section title="Données">
          <Row label="Vider l'historique" onPress={handleClearHistory} danger />
        </Section>

        {/* Legal + version */}
        <Section title="Infos">
          <Row
            label="Conditions d'utilisation"
            onPress={() => Linking.openURL('https://wealthclock.app/cgu')}
          />
          <Row
            label="Politique de confidentialité"
            onPress={() => Linking.openURL('https://wealthclock.app/privacy')}
          />
          <Row label="Version" value={APP_VERSION} />
        </Section>
      </ScrollView>

      {/* Salary edit modal */}
      <Modal
        visible={editingSalary}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingSalary(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditingSalary(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Modifier le salaire</Text>
            <TextInput
              style={styles.modalInput}
              value={salaryInput}
              onChangeText={(v) => {
                setSalaryInput(v)
                setSalaryError(null)
              }}
              keyboardType="numeric"
              placeholder="Ex : 45000"
              placeholderTextColor="#44445A"
              autoFocus
            />
            {salaryError ? <Text style={styles.modalError}>{salaryError}</Text> : null}
            <Pressable style={styles.modalCta} onPress={confirmSalaryEdit}>
              <Text style={styles.modalCtaText}>Confirmer</Text>
            </Pressable>
            <Pressable
              style={styles.modalCancel}
              onPress={() => setEditingSalary(false)}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, gap: 4 },
  back: { fontFamily: 'Outfit', fontSize: 14, color: '#8888AA', marginBottom: 4 },
  title: {
    fontFamily: 'Outfit-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 8 },

  section: { gap: 2 },
  sectionTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 11,
    color: '#8888AA',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 4,
    paddingBottom: 6,
    paddingTop: 12,
  },
  sectionBody: {
    backgroundColor: '#13131A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  rowPressed: { backgroundColor: '#1C1C28' },
  rowLabel: { fontFamily: 'Outfit', fontSize: 15, color: '#FFFFFF' },
  rowLabelDanger: { color: '#FF4444' },
  rowValue: { fontFamily: 'Outfit', fontSize: 14, color: '#8888AA' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: '#13131A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#0A0A0F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'SpaceMono-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  modalError: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#FF4444',
    paddingLeft: 4,
  },
  modalCta: {
    backgroundColor: '#00FF87',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCtaText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
    color: '#0A0A0F',
  },
  modalCancel: { alignItems: 'center', paddingVertical: 10 },
  modalCancelText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#8888AA',
  },
})
