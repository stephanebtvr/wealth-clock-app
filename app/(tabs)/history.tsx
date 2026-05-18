import { useState } from 'react'
import {
  Animated,
  PanResponder,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useWealthStore } from '@/store/wealthStore'
import { formatCurrency } from '@/utils/formatCurrency'
import type { ValueResult, MomentRecord } from '@/types'

type HistoryItem = ValueResult | MomentRecord
type HistorySection = {
  title: string
  data: HistoryItem[]
  type: 'value' | 'moment'
}

// ─── Swipeable row ────────────────────────────────────────────────────────────

const DELETE_THRESHOLD = -72

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode
  onDelete: () => void
}) {
  const [translateX] = useState(() => new Animated.Value(0))
  const [rowHeight] = useState(() => new Animated.Value(1))

  const [panResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dy) < 20,
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(Math.max(g.dx, DELETE_THRESHOLD))
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < DELETE_THRESHOLD / 2) {
          Animated.timing(rowHeight, {
            toValue: 0,
            duration: 220,
            useNativeDriver: false,
          }).start(onDelete)
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
        }
      },
    }),
  )

  return (
    <Animated.View
      style={[
        styles.swipeWrapper,
        {
          maxHeight: rowHeight.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
          opacity: rowHeight,
        },
      ]}
    >
      <View style={styles.deleteHint}>
        <Text style={styles.deleteHintIcon}>🗑</Text>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </Animated.View>
  )
}

// ─── Rows ─────────────────────────────────────────────────────────────────────

function ValueRow({ item, onDelete }: { item: ValueResult; onDelete: () => void }) {
  return (
    <SwipeableRow onDelete={onDelete}>
      <View style={styles.row}>
        <Text style={styles.rowEmoji}>{item.emoji}</Text>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{formatCurrency(item.price, 2)}</Text>
          <Text style={styles.rowSub}>{item.label} de travail</Text>
        </View>
        <Text style={styles.rowRight}>{item.comparison}</Text>
      </View>
    </SwipeableRow>
  )
}

function MomentRow({ item, onDelete }: { item: MomentRecord; onDelete: () => void }) {
  const date = new Date(item.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  })
  return (
    <SwipeableRow onDelete={onDelete}>
      <View style={styles.row}>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowSub}>{date}</Text>
        </View>
        <Text style={styles.rowAmount}>{formatCurrency(item.amount, 2)}</Text>
      </View>
    </SwipeableRow>
  )
}

function EmptySection({ label }: { label: string }) {
  return (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{label}</Text>
    </View>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const valueHistory = useWealthStore((s) => s.valueHistory)
  const momentHistory = useWealthStore((s) => s.momentHistory)
  const removeValueResult = useWealthStore((s) => s.removeValueResult)
  const removeMomentRecord = useWealthStore((s) => s.removeMomentRecord)

  const sections: HistorySection[] = [
    { title: 'Valeurs calculées', data: valueHistory.slice(0, 10) as HistoryItem[], type: 'value' },
    { title: 'Moments calculés', data: momentHistory.slice(0, 20) as HistoryItem[], type: 'moment' },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
      </View>

      <SectionList<HistoryItem, HistorySection>
        sections={sections}
        keyExtractor={(item, index) =>
          'price' in item ? `v-${item.price}-${index}` : `m-${item.id}`
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item, section }) => {
          if (section.type === 'value' && 'price' in item) {
            return <ValueRow item={item} onDelete={() => removeValueResult(item.price)} />
          }
          if ('id' in item) {
            return <MomentRow item={item} onDelete={() => removeMomentRecord(item.id)} />
          }
          return null
        }}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <EmptySection
              label={
                section.type === 'value'
                  ? 'Aucun scan de valeur encore.'
                  : 'Aucun moment calculé encore.'
              }
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0F' },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: {
    fontFamily: 'Outfit-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  listContent: { paddingBottom: 32 },

  sectionHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: {
    fontFamily: 'Outfit-Bold',
    fontSize: 13,
    color: '#8888AA',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  swipeWrapper: { overflow: 'hidden', position: 'relative' },
  deleteHint: {
    position: 'absolute',
    right: 20,
    top: 4,
    bottom: 4,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CC0000',
    borderRadius: 10,
  },
  deleteHintIcon: { fontSize: 18 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131A',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    gap: 12,
  },
  rowEmoji: { fontSize: 22, width: 30, textAlign: 'center' },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 15,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  rowSub: { fontFamily: 'Outfit', fontSize: 12, color: '#8888AA' },
  rowRight: {
    fontFamily: 'Outfit',
    fontSize: 12,
    color: '#44445A',
    maxWidth: 100,
    textAlign: 'right',
  },
  rowAmount: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 15,
    color: '#00FF87',
    fontVariant: ['tabular-nums'],
  },

  emptyBox: { marginHorizontal: 16, marginVertical: 4, padding: 20, alignItems: 'center' },
  emptyText: { fontFamily: 'Outfit', fontSize: 13, color: '#44445A', textAlign: 'center' },
})
