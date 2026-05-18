import { useCallback, useEffect, useState } from 'react'
import Purchases from 'react-native-purchases'
import type { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases'
import { useWealthStore } from '../store/wealthStore'
import { ENTITLEMENT_PREMIUM } from '../config/revenuecat'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PurchaseState = 'idle' | 'loading' | 'success' | 'cancelled' | 'error' | 'already_purchased'

interface CustomerInfoShape {
  entitlements: {
    active: Record<string, { isActive: boolean } | undefined>
  }
}

function hasPremium(info: CustomerInfoShape): boolean {
  return !!info.entitlements.active[ENTITLEMENT_PREMIUM]?.isActive
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePurchases() {
  const setIsPremium = useWealthStore((s) => s.setIsPremium)
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null)

  useEffect(() => {
    Purchases.getOfferings()
      .then(setOfferings)
      .catch(() => {})
  }, [])

  const checkPremiumStatus = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo()
      setIsPremium(hasPremium(info as CustomerInfoShape))
    } catch {
      // Silent — do not update premium state on network error
    }
  }, [setIsPremium])

  const purchasePremium = useCallback(
    async (pkg: PurchasesPackage) => {
      setPurchaseState('loading')
      setError(null)
      try {
        const result = await Purchases.purchasePackage(pkg)
        setIsPremium(hasPremium(result.customerInfo as CustomerInfoShape))
        setPurchaseState('success')
      } catch (e) {
        const err = e as { userCancelled?: boolean; message?: string }
        if (err.userCancelled) {
          setPurchaseState('cancelled')
        } else {
          setPurchaseState('error')
          setError(err.message ?? 'Une erreur est survenue')
        }
      }
    },
    [setIsPremium],
  )

  const restorePurchases = useCallback(async () => {
    setPurchaseState('loading')
    setError(null)
    try {
      const info = await Purchases.restorePurchases()
      const premium = hasPremium(info as CustomerInfoShape)
      setIsPremium(premium)
      setPurchaseState(premium ? 'success' : 'already_purchased')
    } catch (e) {
      const err = e as { message?: string }
      setPurchaseState('error')
      setError(err.message ?? 'Restauration impossible')
    }
  }, [setIsPremium])

  return { purchaseState, error, offerings, checkPremiumStatus, purchasePremium, restorePurchases }
}
