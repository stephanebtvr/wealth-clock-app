import { useCallback, useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
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
import ValueResultDisplay from '@/components/ValueResultDisplay'
import { validatePrice } from '@/utils/validators'
import { convertPriceToTime } from '@/utils/valueConverter'
import { formatCurrency } from '@/utils/formatCurrency'
import { useWealthStore } from '@/store/wealthStore'
import type { ValueResult } from '@/types'

const SUGGESTIONS = [
  { emoji: '☕', label: '4 €', value: 4 },
  { emoji: '🍕', label: '12 €', value: 12 },
  { emoji: '👟', label: '120 €', value: 120 },
  { emoji: '✈️', label: '450 €', value: 450 },
]

export default function ValueScannerScreen() {
  const router = useRouter()
  const { salary, valueHistory, addValueResult } = useWealthStore()

  const [rawInput, setRawInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ValueResult | null>(null)

  const annualSalary = salary ?? 0

  const compute = useCallback(
    (priceInput: string | number) => {
      const val = validatePrice(priceInput)
      if (!val.ok) {
        setError(val.error)
        setResult(null)
        return
      }
      setError(null)
      const computed = convertPriceToTime(val.value, annualSalary)
      setResult(computed)
      addValueResult(computed)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    },
    [annualSalary, addValueResult]
  )

  const handleChange = useCallback(
    (text: string) => {
      setRawInput(text)
      if (!text.trim()) {
        setError(null)
        setResult(null)
        return
      }
      const val = validatePrice(text)
      setError(val.ok ? null : val.error)
      if (val.ok) {
        const computed = convertPriceToTime(val.value, annualSalary)
        setResult(computed)
        addValueResult(computed)
      }
    },
    [annualSalary, addValueResult]
  )

  const handleSuggestion = (value: number) => {
    Haptics.selectionAsync()
    setRawInput(String(value))
    compute(value)
    Keyboard.dismiss()
  }

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
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.back}>← Retour</Text>
            </Pressable>
            <Text style={styles.title}>Valeur réelle</Text>
            <Text style={styles.subtitle}>Combien de temps de travail ça vaut vraiment ?</Text>
          </View>

          {/* Price input */}
          <View style={[styles.inputRow, error ? styles.inputError : null]}>
            <TextInput
              style={styles.input}
              value={rawInput}
              onChangeText={handleChange}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor="#44445A"
              returnKeyType="done"
              onSubmitEditing={() => rawInput.trim() && compute(rawInput)}
              autoFocus={false}
            />
            <Text style={styles.inputSuffix}>€</Text>
          </View>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <Text style={styles.hint}>Entre 0,01 € et 10 000 000 €</Text>
          )}

          {/* Quick suggestions */}
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s.value}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
                onPress={() => handleSuggestion(s.value)}
              >
                <Text style={styles.chipEmoji}>{s.emoji}</Text>
                <Text style={styles.chipLabel}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Result */}
          {result && <ValueResultDisplay result={result} />}

          {/* History */}
          {valueHistory.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyTitle}>Historique</Text>
              {valueHistory.map((item, i) => (
                <Pressable
                  key={i}
                  style={styles.historyRow}
                  onPress={() => {
                    setRawInput(String(item.price))
                    setResult(item)
                    setError(null)
                  }}
                >
                  <Text style={styles.historyEmoji}>{item.emoji}</Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyPrice}>{formatCurrency(item.price)}</Text>
                    <Text style={styles.historyLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.historyComparison}>{item.comparison}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
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

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    paddingHorizontal: 20,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  input: {
    flex: 1,
    fontFamily: 'Outfit-Bold',
    fontSize: 36,
    color: '#FFFFFF',
    paddingVertical: 16,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  inputSuffix: {
    fontFamily: 'Outfit-Bold',
    fontSize: 20,
    color: '#8888AA',
    marginLeft: 8,
  },
  hint: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#44445A',
    textAlign: 'center',
    marginTop: -8,
  },
  errorText: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#FF4444',
    textAlign: 'center',
    marginTop: -8,
  },

  // Suggestions
  suggestions: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    backgroundColor: '#13131A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    paddingVertical: 10,
    alignItems: 'center',
    gap: 4,
  },
  chipPressed: {
    backgroundColor: '#1C1C28',
    borderColor: '#00FF87',
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipLabel: {
    fontFamily: 'Outfit-Bold',
    fontSize: 11,
    color: '#8888AA',
  },

  // History
  historySection: {
    gap: 8,
  },
  historyTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
    color: '#44445A',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    gap: 12,
  },
  historyEmoji: {
    fontSize: 22,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyPrice: {
    fontFamily: 'Outfit-Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  historyLabel: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#8888AA',
  },
  historyComparison: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#44445A',
  },
})
