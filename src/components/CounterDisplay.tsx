import React, { memo, useEffect, useRef } from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { COUNTER_INTERVAL_MS } from '../utils/constants'
import { formatCurrency } from '../utils/formatCurrency'

interface Props {
  accumulatedRef: React.MutableRefObject<number>
  secondRate: number
}

// setNativeProps bypasses React's reconciler entirely — the TextInput text is updated
// directly on the native side every 100ms without triggering any JS re-render.
// This is critical: at 10 updates/second a setState approach would re-render the entire
// home screen tree, causing jank and defeating the "premium feel" of the counter.
const CounterDisplay = memo(function CounterDisplay({ accumulatedRef, secondRate }: Props) {
  const displayRef = useRef<TextInput>(null)

  useEffect(() => {
    if (!secondRate) return

    const id = setInterval(() => {
      displayRef.current?.setNativeProps({
        text: formatCurrency(accumulatedRef.current, 6),
      })
    }, COUNTER_INTERVAL_MS)

    return () => clearInterval(id)
  }, [accumulatedRef, secondRate])

  return (
    <TextInput
      ref={displayRef}
      style={styles.counter}
      defaultValue={formatCurrency(accumulatedRef.current, 6)}
      editable={false}
      caretHidden
    />
  )
})

export default CounterDisplay

const styles = StyleSheet.create({
  counter: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 72,
    color: '#00FF87',
    letterSpacing: -2,
    textAlign: 'center',
    // tabular-nums keeps digit widths identical so the counter doesn't shift horizontally
    fontVariant: ['tabular-nums'],
  },
})
