import { memo, useRef } from 'react'
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { ReceiptResultItem } from '../utils/receiptConverter'
import { formatCurrency } from '../utils/formatCurrency'

interface Props {
  item: ReceiptResultItem
  onDelete: (id: string) => void
}

const SWIPE_THRESHOLD = 60
const DELETE_WIDTH = 72
const WORK_MINUTES_PER_DAY = 8 * 60

const ReceiptLine = memo(function ReceiptLine({ item, onDelete }: Props) {
  const translateX = useRef(new Animated.Value(0)).current
  const isHighlighted = item.workMinutes > WORK_MINUTES_PER_DAY

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        if (g.dx < 0) translateX.setValue(Math.max(g.dx, -DELETE_WIDTH))
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -DELETE_WIDTH,
            duration: 150,
            useNativeDriver: true,
          }).start()
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
        }
      },
    })
  ).current

  const resetSwipe = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
  }

  return (
    <View style={styles.container}>
      {/* Delete button revealed by swipe */}
      <Pressable
        style={styles.deleteBtn}
        onPress={() => {
          onDelete(item.id)
          resetSwipe()
        }}
      >
        <Text style={styles.deleteBtnText}>🗑️</Text>
      </Pressable>

      <Animated.View
        style={[
          styles.row,
          isHighlighted && styles.rowHighlighted,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
        <View style={styles.info}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          <Text style={[styles.timeLabel, isHighlighted && styles.timeLabelHighlighted]}>
            {item.timeLabel}
          </Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.price}>{formatCurrency(item.price, 2)}</Text>
        </View>
      </Animated.View>
    </View>
  )
})

export default ReceiptLine

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  deleteBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    backgroundColor: '#FF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  deleteBtnText: {
    fontSize: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13131A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    gap: 12,
  },
  rowHighlighted: {
    borderColor: '#FF444444',
    backgroundColor: '#1A1010',
  },
  emoji: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  timeLabel: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#8888AA',
  },
  timeLabelHighlighted: {
    color: '#FF6666',
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  price: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
})
