import { memo, useEffect, useRef } from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { formatCurrency } from '../utils/formatCurrency'
import { COUNTER_INTERVAL_MS } from '../utils/constants'

interface Props {
  costRef: React.MutableRefObject<number>
  elapsedSecondsRef: React.MutableRefObject<number>
  isRunning: boolean
}

const MeetingCounter = memo(function MeetingCounter({ costRef, elapsedSecondsRef, isRunning }: Props) {
  const costDisplayRef = useRef<TextInput>(null)
  const timerDisplayRef = useRef<TextInput>(null)

  useEffect(() => {
    if (!isRunning) return
    const id = setInterval(() => {
      costDisplayRef.current?.setNativeProps({
        text: formatCurrency(costRef.current, 2),
      })
      const total = Math.floor(elapsedSecondsRef.current)
      const h = Math.floor(total / 3_600)
      const m = Math.floor((total % 3_600) / 60)
      const s = total % 60
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const ss = String(s).padStart(2, '0')
      timerDisplayRef.current?.setNativeProps({ text: `${hh}:${mm}:${ss}` })
    }, COUNTER_INTERVAL_MS)
    return () => clearInterval(id)
  }, [costRef, elapsedSecondsRef, isRunning])

  return (
    <>
      <TextInput
        ref={costDisplayRef}
        style={styles.cost}
        defaultValue={formatCurrency(0, 2)}
        editable={false}
        caretHidden
      />
      <TextInput
        ref={timerDisplayRef}
        style={styles.timer}
        defaultValue="00:00:00"
        editable={false}
        caretHidden
      />
    </>
  )
})

export default MeetingCounter

const styles = StyleSheet.create({
  cost: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 80,
    color: '#FF4444',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  timer: {
    fontFamily: 'Outfit-Bold',
    fontSize: 22,
    color: '#CC0000',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    letterSpacing: 2,
  },
})
