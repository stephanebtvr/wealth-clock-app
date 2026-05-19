import { useRef, useState } from 'react'
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
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
  noBorder,
}: {
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
  noBorder?: boolean
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, noBorder && styles.rowNoBorder, pressed && styles.rowPressed]}
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
  const [salaryInput, setSalaryInput] = useState('')
  const [salaryError, setSalaryError] = useState<string | null>(null)
  const inputRef = useRef<TextInput>(null)

  // ─── Salary edit (inline — no nested Modal) ───────────────────────────────

  const openSalaryEdit = () => {
    setSalaryInput(salary?.toString() ?? '')
    setSalaryError(null)
    setEditingSalary(true)
    // Focus après le prochain rendu
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const cancelSalaryEdit = () => {
    Keyboard.dismiss()
    setEditingSalary(false)
  }

  const confirmSalaryEdit = async () => {
    const result = validateSalary(salaryInput)
    if (!result.ok) {
      setSalaryError(result.error)
      return
    }
    Keyboard.dismiss()
    setSalary(result.value)
    await saveSalary(result.value)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setEditingSalary(false)
  }

  // ─── Calc mode ────────────────────────────────────────────────────────────

  const toggleCalcMode = () => {
    const next: CalcMode = calcMode === 'work_only' ? 'annualized' : 'work_only'
    Haptics.selectionAsync()
    setCalculationMode(next)
  }

  const calcModeLabel = calcMode === 'work_only' ? 'Jours ouvrés (défaut)' : 'Annualisé 24/7'

  // ─── Clear history ────────────────────────────────────────────────────────

  const handleClearHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(
      "Vider l'historique",
      "Supprimer toutes les valeurs et tous les moments calculés ? Cette action est irréversible.",
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

  // ─── Restore ──────────────────────────────────────────────────────────────

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await restorePurchases()
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>← Retour</Text>
          </Pressable>
          <Text style={styles.title}>Paramètres</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Salary */}
          <Section title="Mon salaire">
            {editingSalary ? (
              /* ── Inline edit card ── */
              <View style={styles.editCard}>
                <Text style={styles.editLabel}>Salaire annuel brut</Text>
                <View style={styles.editInputRow}>
                  <TextInput
                    ref={inputRef}
                    style={styles.editInput}
                    value={salaryInput}
                    onChangeText={(v) => {
                      setSalaryInput(v)
                      setSalaryError(null)
                    }}
                    keyboardType="numeric"
                    placeholder="Ex : 45 000"
                    placeholderTextColor="#44445A"
                    returnKeyType="done"
                    onSubmitEditing={confirmSalaryEdit}
                  />
                  <Text style={styles.editSuffix}>€ / an</Text>
                </View>
                {salaryError ? (
                  <Text style={styles.editError}>{salaryError}</Text>
                ) : (
                  <Text style={styles.editHint}>Entre 1 000 € et 10 000 000 €</Text>
                )}
                <View style={styles.editActions}>
                  <Pressable style={styles.editCancel} onPress={cancelSalaryEdit}>
                    <Text style={styles.editCancelText}>Annuler</Text>
                  </Pressable>
                  <Pressable style={styles.editConfirm} onPress={confirmSalaryEdit}>
                    <Text style={styles.editConfirmText}>Confirmer</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Row
                label="Salaire annuel brut"
                value={salary ? `${salary.toLocaleString('fr-FR')} €` : 'Non défini'}
                onPress={openSalaryEdit}
              />
            )}
            <Row
              label="Mode de calcul"
              value={calcModeLabel}
              onPress={toggleCalcMode}
              noBorder
            />
          </Section>

          {/* Premium */}
          <Section title="Premium">
            {isPremium ? (
              <Row label="Statut" value="✓ Premium actif" />
            ) : (
              <Row label="Déverrouiller Premium" onPress={() => router.push('/paywall')} />
            )}
            <Row label="Restaurer mes achats" onPress={handleRestore} noBorder />
          </Section>

          {/* Data */}
          <Section title="Données">
            <Row label="Vider l'historique" onPress={handleClearHistory} danger noBorder />
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
            <Row label="Version" value={APP_VERSION} noBorder />
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },
  flex: { flex: 1 },

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
  rowNoBorder: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: '#1C1C28' },
  rowLabel: { fontFamily: 'Outfit', fontSize: 15, color: '#FFFFFF' },
  rowLabelDanger: { color: '#FF4444' },
  rowValue: { fontFamily: 'Outfit', fontSize: 14, color: '#8888AA' },

  // Inline salary editor
  editCard: {
    padding: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  editLabel: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
    color: '#8888AA',
  },
  editInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#00FF87',
    paddingHorizontal: 14,
  },
  editInput: {
    flex: 1,
    fontFamily: 'SpaceMono-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    paddingVertical: 14,
    fontVariant: ['tabular-nums'],
  },
  editSuffix: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#8888AA',
    marginLeft: 6,
  },
  editHint: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#44445A',
  },
  editError: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#FF4444',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  editCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1C1C28',
    alignItems: 'center',
  },
  editCancelText: {
    fontFamily: 'Outfit',
    fontSize: 15,
    color: '#8888AA',
  },
  editConfirm: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#00FF87',
    alignItems: 'center',
  },
  editConfirmText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 15,
    color: '#0A0A0F',
  },
})
