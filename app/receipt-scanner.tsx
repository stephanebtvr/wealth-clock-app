import { useCallback, useMemo, useState } from 'react'
import {
  FlatList,
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
import ReceiptLine from '@/components/ReceiptLine'
import {
  convertReceipt,
  RECEIPT_PRESETS,
  type ReceiptItem,
} from '@/utils/receiptConverter'
import { validatePrice } from '@/utils/validators'
import { formatCurrency } from '@/utils/formatCurrency'
import { useWealthStore } from '@/store/wealthStore'

let idCounter = 0
function nextId() {
  idCounter += 1
  return String(idCounter)
}

export default function ReceiptScannerScreen() {
  const router = useRouter()
  const { salary } = useWealthStore()
  const annualSalary = salary ?? 0

  const [items, setItems] = useState<ReceiptItem[]>([])
  const [labelInput, setLabelInput] = useState('')
  const [priceInput, setPriceInput] = useState('')
  const [priceError, setPriceError] = useState<string | null>(null)

  const result = useMemo(
    () => convertReceipt(items, annualSalary),
    [items, annualSalary]
  )

  const addPreset = useCallback(
    (preset: { emoji: string; label: string; price: number }) => {
      Haptics.selectionAsync()
      const item: ReceiptItem = {
        id: nextId(),
        label: `${preset.emoji} ${preset.label}`,
        price: preset.price,
      }
      setItems((prev) => [...prev, item])
    },
    []
  )

  const addCustomItem = useCallback(() => {
    const val = validatePrice(priceInput)
    if (!val.ok) {
      setPriceError(val.error)
      return
    }
    const label = labelInput.trim() || 'Article'
    const item: ReceiptItem = {
      id: nextId(),
      label,
      price: val.value,
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setItems((prev) => [...prev, item])
    setLabelInput('')
    setPriceInput('')
    setPriceError(null)
    Keyboard.dismiss()
  }, [labelInput, priceInput])

  const deleteItem = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const handlePriceChange = useCallback((text: string) => {
    setPriceInput(text)
    if (!text.trim()) {
      setPriceError(null)
      return
    }
    const val = validatePrice(text)
    setPriceError(val.ok ? null : val.error)
  }, [])

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
          <Text style={styles.title}>Life Cost Scanner</Text>
          <Text style={styles.subtitle}>Combien de temps de vie vaut ta liste ?</Text>
        </View>

        {/* Preset chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetsScroll}
          contentContainerStyle={styles.presetsContent}
        >
          {RECEIPT_PRESETS.map((p) => (
            <Pressable
              key={p.label}
              style={({ pressed }) => [styles.presetChip, pressed && styles.presetChipPressed]}
              onPress={() => addPreset(p)}
            >
              <Text style={styles.presetEmoji}>{p.emoji}</Text>
              <Text style={styles.presetPrice}>{formatCurrency(p.price, 2)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Custom add row */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.labelInput}
            value={labelInput}
            onChangeText={setLabelInput}
            placeholder="Article"
            placeholderTextColor="#44445A"
            returnKeyType="next"
          />
          <View style={[styles.priceInput, priceError ? styles.inputError : null]}>
            <TextInput
              style={styles.priceInputText}
              value={priceInput}
              onChangeText={handlePriceChange}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor="#44445A"
              returnKeyType="done"
              onSubmitEditing={addCustomItem}
            />
            <Text style={styles.priceInputSuffix}>€</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
            onPress={addCustomItem}
          >
            <Text style={styles.addBtnText}>+</Text>
          </Pressable>
        </View>
        {priceError ? <Text style={styles.errorText}>{priceError}</Text> : null}

        {/* Items list */}
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyText}>Ajoute des articles pour voir le vrai coût</Text>
          </View>
        ) : (
          <FlatList
            data={result.items}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <ReceiptLine item={item} onDelete={deleteItem} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {/* Sticky total footer */}
        {items.length > 0 && (
          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Total</Text>
              <Text style={styles.footerTotal}>{formatCurrency(result.total, 2)}</Text>
            </View>
            <View style={styles.footerRow}>
              <Text style={styles.footerTimeLabel}>{result.totalLabel}</Text>
              <Text style={styles.footerItems}>{items.length} article{items.length > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.shockPhraseRow}>
              <Text style={styles.shockPhrase}>💥 {result.shockPhrase}</Text>
            </View>
          </View>
        )}
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

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 4,
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

  // Presets
  presetsScroll: {
    marginTop: 16,
  },
  presetsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  presetChip: {
    backgroundColor: '#13131A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 4,
  },
  presetChipPressed: {
    backgroundColor: '#1C1C28',
    borderColor: '#00FF87',
  },
  presetEmoji: {
    fontSize: 20,
  },
  presetPrice: {
    fontFamily: 'Outfit-Bold',
    fontSize: 11,
    color: '#8888AA',
    fontVariant: ['tabular-nums'],
  },

  // Add row
  addRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  labelInput: {
    flex: 1,
    fontFamily: 'Outfit',
    fontSize: 15,
    color: '#FFFFFF',
    backgroundColor: '#13131A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    paddingHorizontal: 12,
    width: 100,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  priceInputText: {
    flex: 1,
    fontFamily: 'Outfit-Bold',
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 12,
    fontVariant: ['tabular-nums'],
  },
  priceInputSuffix: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#44445A',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00FF87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressed: {
    backgroundColor: '#00CC6A',
  },
  addBtnText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 22,
    color: '#0A0A0F',
    lineHeight: 26,
  },
  errorText: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#FF4444',
    paddingHorizontal: 20,
    marginTop: -4,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#44445A',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // List
  list: {
    flex: 1,
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  separator: {
    height: 8,
  },

  // Footer
  footer: {
    backgroundColor: '#13131A',
    borderTopWidth: 1,
    borderTopColor: '#1E1E2E',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontFamily: 'Outfit-Bold',
    fontSize: 11,
    color: '#44445A',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  footerTotal: {
    fontFamily: 'Outfit-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  footerTimeLabel: {
    fontFamily: 'Outfit-Bold',
    fontSize: 16,
    color: '#00FF87',
  },
  footerItems: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#44445A',
  },
  shockPhraseRow: {
    backgroundColor: '#1C1C28',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FF444433',
    marginTop: 4,
  },
  shockPhrase: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
    color: '#FF8888',
    textAlign: 'center',
  },
})
