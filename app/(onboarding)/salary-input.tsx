import { useState, useCallback } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { SafeAreaView } from 'react-native-safe-area-context'
import { validateSalary } from '@/utils/validators'
import { useSecureStorage } from '@/hooks/useSecureStorage'
import { useWealthStore } from '@/store/wealthStore'

type SalaryType = 'brut' | 'net'

// Net ≈ brut × 0.78 (approximation charges salariales France)
const NET_TO_BRUT_FACTOR = 1 / 0.78

export default function SalaryInputScreen() {
  const router = useRouter()
  const { saveSalary } = useSecureStorage()
  const { setSalary, completeOnboarding } = useWealthStore()

  const [rawInput, setRawInput] = useState('')
  const [salaryType, setSalaryType] = useState<SalaryType>('brut')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = useCallback(
    (text: string) => {
      setRawInput(text)
      if (!text.trim()) {
        setError(null)
        return
      }
      const result = validateSalary(text)
      setError(result.ok ? null : result.error)
    },
    []
  )

  const handleToggle = useCallback((type: SalaryType) => {
    setSalaryType(type)
    Haptics.selectionAsync()
  }, [])

  const isValid = rawInput.trim().length > 0 && validateSalary(rawInput).ok

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    Keyboard.dismiss()
    setSubmitting(true)

    const result = validateSalary(rawInput)
    if (!result.ok) {
      setSubmitting(false)
      return
    }

    const brutSalary =
      salaryType === 'net' ? Math.round(result.value * NET_TO_BRUT_FACTOR) : result.value

    await saveSalary(brutSalary)
    setSalary(brutSalary)
    completeOnboarding()

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.flex} onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <Text style={styles.back}>← Retour</Text>
              </Pressable>
              <Text style={styles.title}>Votre salaire</Text>
              <Text style={styles.subtitle}>
                Pour calculer ce que vaut chaque seconde de votre temps
              </Text>
            </View>

            <View style={styles.body}>
              <View style={styles.toggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, salaryType === 'brut' && styles.toggleActive]}
                  onPress={() => handleToggle('brut')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.toggleText, salaryType === 'brut' && styles.toggleTextActive]}
                  >
                    Brut
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, salaryType === 'net' && styles.toggleActive]}
                  onPress={() => handleToggle('net')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.toggleText, salaryType === 'net' && styles.toggleTextActive]}
                  >
                    Net
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputRow, error ? styles.inputError : null]}>
                <TextInput
                  style={styles.input}
                  value={rawInput}
                  onChangeText={handleChange}
                  keyboardType="numeric"
                  placeholder="Ex : 35 000"
                  placeholderTextColor="#44445A"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  autoFocus
                />
                <Text style={styles.inputSuffix}>€ / an</Text>
              </View>

              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <Text style={styles.hint}>Entre 1 000 € et 10 000 000 € par an</Text>
              )}
            </View>

            <View style={styles.footer}>
              <Pressable
                style={({ pressed }) => [
                  styles.cta,
                  (!isValid || submitting) && styles.ctaDisabled,
                  pressed && isValid && styles.ctaPressed,
                ]}
                onPress={handleSubmit}
                disabled={!isValid || submitting}
              >
                <Text style={[styles.ctaText, (!isValid || submitting) && styles.ctaTextDisabled]}>
                  Voir mon compteur
                </Text>
              </Pressable>
              <Text style={styles.privacy}>🔒 Votre salaire reste sur votre appareil</Text>
            </View>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
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
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  header: {
    paddingTop: 8,
    gap: 12,
  },
  back: {
    color: '#8888AA',
    fontSize: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#8888AA',
    lineHeight: 22,
  },
  body: {
    gap: 12,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#13131A',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#1C1C28',
  },
  toggleText: {
    fontSize: 15,
    color: '#8888AA',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#00FF87',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingVertical: 16,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  inputSuffix: {
    fontSize: 16,
    color: '#8888AA',
    marginLeft: 8,
  },
  hint: {
    fontSize: 12,
    color: '#44445A',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#FF4444',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    gap: 16,
    paddingBottom: 8,
  },
  cta: {
    backgroundColor: '#00FF87',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#1C1C28',
  },
  ctaPressed: {
    backgroundColor: '#00CC6A',
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0A0A0F',
    letterSpacing: 0.2,
  },
  ctaTextDisabled: {
    color: '#44445A',
  },
  privacy: {
    fontSize: 12,
    color: '#44445A',
  },
})
