import { memo, useEffect, useRef } from 'react'
import { StyleSheet, TextInput } from 'react-native'
import { formatCurrency } from '../utils/formatCurrency'
import { COUNTER_INTERVAL_MS } from '../utils/constants'

interface Props {
  lossRef: React.MutableRefObject<number>
  elapsedSecondsRef: React.MutableRefObject<number>
}

const NegativeCounter = memo(function NegativeCounter({ lossRef, elapsedSecondsRef }: Props) {
  const lossDisplayRef = useRef<TextInput>(null)
  const timerDisplayRef = useRef<TextInput>(null)

  useEffect(() => {
    const id = setInterval(() => {
      lossDisplayRef.current?.setNativeProps({
        text: `−${formatCurrency(lossRef.current, 2)}`,
      })
      const total = Math.floor(elapsedSecondsRef.current)
      const h = Math.floor(total / 3_600)
      const m = Math.floor((total % 3_600) / 60)
      const s = total % 60
      timerDisplayRef.current?.setNativeProps({
        text: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      })
    }, COUNTER_INTERVAL_MS)
    return () => clearInterval(id)
  }, [lossRef, elapsedSecondsRef])

  return (
    <>
      <TextInput
        ref={lossDisplayRef}
        style={styles.loss}
        defaultValue="−0,00 €"
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

export default NegativeCounter

const styles = StyleSheet.create({
  loss: {
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
