import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { minuteRate, secondRate } from '../utils/salaryCalculator'
import { COUNTER_INTERVAL_MS } from '../utils/constants'
import type { NegativeActivityType } from '../types'

export interface NegativeConfig {
  activityType: NegativeActivityType
  annualSalary: number
  startedAt: number
  durationMinutes?: number
}

type CounterPhase = 'running' | 'stopped'

export function useNegativeCounter(config: NegativeConfig | null) {
  const isSimulated = !!config?.durationMinutes

  // Compute initial values once — avoids reading .current during render
  const initialLoss = isSimulated
    ? minuteRate(config!.annualSalary) * config!.durationMinutes!
    : 0
  const initialElapsed = isSimulated ? config!.durationMinutes! * 60 : 0

  const lossRef = useRef(initialLoss)
  const elapsedSecondsRef = useRef(initialElapsed)
  const startRef = useRef(config?.startedAt ?? 0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const configRef = useRef(config)

  const [currentLoss, setCurrentLoss] = useState(initialLoss)
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsed)
  const [phase, setPhase] = useState<CounterPhase>(() =>
    config && !isSimulated ? 'running' : 'stopped'
  )

  const isRunning = phase === 'running' && !!config

  useEffect(() => {
    configRef.current = config
  }, [config])

  const computeFromClock = useCallback(() => {
    if (!configRef.current || configRef.current.durationMinutes) return
    const elapsed = (Date.now() - startRef.current) / 1000
    elapsedSecondsRef.current = elapsed
    lossRef.current = secondRate(configRef.current.annualSalary) * elapsed
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

  const startedAt = config?.startedAt
  const durationMinutes = config?.durationMinutes
  useEffect(() => {
    if (!startedAt || durationMinutes != null) {
      stopInterval()
      return
    }
    startRef.current = startedAt
    startInterval()
    return stopInterval
  }, [startedAt, durationMinutes, startInterval, stopInterval])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && configRef.current && !configRef.current.durationMinutes) {
        computeFromClock()
        setCurrentLoss(lossRef.current)
        setElapsedSeconds(elapsedSecondsRef.current)
      }
    })
    return () => sub.remove()
  }, [computeFromClock])

  const stop = useCallback(() => {
    stopInterval()
    setCurrentLoss(lossRef.current)
    setElapsedSeconds(elapsedSecondsRef.current)
    setPhase('stopped')
  }, [stopInterval])

  return {
    lossRef,
    elapsedSecondsRef,
    currentLoss,
    elapsedSeconds,
    isRunning,
    stop,
  }
}
