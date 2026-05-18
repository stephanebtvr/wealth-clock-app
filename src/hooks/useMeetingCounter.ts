import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { minuteRate } from '../utils/salaryCalculator'
import { COUNTER_INTERVAL_MS } from '../utils/constants'

export interface MeetingConfig {
  participants: number
  averageSalary: number
  startedAt: number
}

type CounterPhase = 'running' | 'paused' | 'stopped'

export function useMeetingCounter(config: MeetingConfig | null) {
  const costRef = useRef(0)
  const elapsedSecondsRef = useRef(0)
  const startRef = useRef(config?.startedAt ?? 0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const configRef = useRef(config)

  const [currentCost, setCurrentCost] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [phase, setPhase] = useState<CounterPhase>(() => (config ? 'running' : 'stopped'))

  const isRunning = phase === 'running' && !!config

  const computeFromClock = useCallback(() => {
    if (!configRef.current) return
    const elapsed = (Date.now() - startRef.current) / 1000
    elapsedSecondsRef.current = elapsed
    costRef.current =
      configRef.current.participants *
      minuteRate(configRef.current.averageSalary) *
      (elapsed / 60)
  }, [])

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(computeFromClock, COUNTER_INTERVAL_MS)
  }, [computeFromClock])

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Keep configRef in sync via effect (avoids reading .current during render)
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Start/stop interval based on config's startedAt value
  const startedAt = config?.startedAt
  useEffect(() => {
    if (startedAt == null) {
      stopInterval()
      return
    }
    startRef.current = startedAt
    startInterval()
    return stopInterval
  }, [startedAt, startInterval, stopInterval])

  // Recalculate from wall clock when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && configRef.current) {
        computeFromClock()
        setCurrentCost(costRef.current)
        setElapsedSeconds(elapsedSecondsRef.current)
      }
    })
    return () => sub.remove()
  }, [computeFromClock])

  const pause = useCallback(() => {
    stopInterval()
    setPhase('paused')
  }, [stopInterval])

  const resume = useCallback(() => {
    if (!configRef.current) return
    // Adjust effective start so elapsed time continues from where it paused
    startRef.current = Date.now() - elapsedSecondsRef.current * 1000
    startInterval()
    setPhase('running')
  }, [startInterval])

  const stop = useCallback(() => {
    stopInterval()
    setCurrentCost(costRef.current)
    setElapsedSeconds(elapsedSecondsRef.current)
    setPhase('stopped')
  }, [stopInterval])

  return {
    costRef,
    elapsedSecondsRef,
    currentCost,
    elapsedSeconds,
    isRunning,
    pause,
    resume,
    stop,
  }
}
