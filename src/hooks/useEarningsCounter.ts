import { useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { useWealthStore } from '../store/wealthStore'
import { todayEarnings } from '../utils/salaryCalculator'
import { COUNTER_INTERVAL_MS } from '../utils/constants'

export function useEarningsCounter() {
  const { salary, secondRate } = useWealthStore()

  // Accumulated value lives in a ref — mutations never trigger re-renders
  const accumulatedRef = useRef(salary ? todayEarnings(salary) : 0)

  // State for EarningsCard reactivity — only updated inside event handlers (AppState
  // foreground) to avoid the react-hooks/set-state-in-effect rule and cascading renders
  const [accumulatedToday, setAccumulatedToday] = useState(() =>
    salary ? todayEarnings(salary) : 0
  )

  // Reset ref when salary / rate changes — ref only, no setState (no re-render cascade)
  useEffect(() => {
    accumulatedRef.current = salary ? todayEarnings(salary) : 0
  }, [salary, secondRate])

  // AppState foreground: full recalculation.
  // setState is safe here because it is inside an event-handler callback, not at the
  // top level of the effect — so it cannot cause cascading render loops.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && salary) {
        const recalc = todayEarnings(salary)
        accumulatedRef.current = recalc
        setAccumulatedToday(recalc)
      }
    })
    return () => sub.remove()
  }, [salary])

  // 100ms interval — increments accumulatedRef only, zero re-renders in hot path
  useEffect(() => {
    if (!secondRate) return
    const id = setInterval(() => {
      accumulatedRef.current += secondRate / 10
    }, COUNTER_INTERVAL_MS)
    return () => clearInterval(id)
  }, [secondRate])

  return {
    accumulatedRef,
    accumulatedToday,
    secondRate,
    minuteRate: secondRate * 60,
    hourlyRate: secondRate * 3_600,
  }
}
