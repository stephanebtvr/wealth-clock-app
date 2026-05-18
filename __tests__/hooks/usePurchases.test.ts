import { renderHook, act } from '@testing-library/react-native'
import { usePurchases } from '../../src/hooks/usePurchases'
import { useWealthStore } from '../../src/store/wealthStore'
import type { PurchasesPackage } from 'react-native-purchases'

// ─── Mock react-native-purchases ─────────────────────────────────────────────

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
  },
}))

import Purchases from 'react-native-purchases'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeCustomerInfo(isPremium: boolean) {
  return {
    entitlements: {
      active: isPremium ? { premium: { isActive: true, identifier: 'premium' } } : {},
    },
  }
}

function makePackage(id = '$rc_monthly'): PurchasesPackage {
  return {
    identifier: id,
    packageType: 'MONTHLY' as never,
    product: { priceString: '2,99 €/mois' } as never,
    offeringIdentifier: 'default',
    presentedOfferingContext: {
      offeringIdentifier: 'default',
      placementIdentifier: null,
      targetingContext: null,
    },
  }
}

function makeOfferings() {
  return {
    current: {
      identifier: 'default',
      serverDescription: '',
      metadata: {},
      availablePackages: [makePackage('$rc_monthly'), makePackage('$rc_annual')],
      monthly: makePackage('$rc_monthly'),
      annual: makePackage('$rc_annual'),
      lifetime: null,
      threeMonth: null,
      sixMonth: null,
      twoMonth: null,
      weekly: null,
    },
    all: {},
  }
}

const mockPurchases = Purchases as unknown as {
  getCustomerInfo: jest.Mock
  getOfferings: jest.Mock
  purchasePackage: jest.Mock
  restorePurchases: jest.Mock
}

// ─── Setup ────────────────────────────────────────────────────────────────────

const store = () => useWealthStore.getState()

beforeEach(() => {
  jest.clearAllMocks()
  store().setIsPremium(false)
  mockPurchases.getCustomerInfo.mockResolvedValue(makeCustomerInfo(false))
  mockPurchases.getOfferings.mockResolvedValue(makeOfferings())
  mockPurchases.purchasePackage.mockResolvedValue({ customerInfo: makeCustomerInfo(true) })
  mockPurchases.restorePurchases.mockResolvedValue(makeCustomerInfo(false))
})

// Renders the hook and flushes the mount async effect (getOfferings)
async function mountHook() {
  const utils = renderHook(() => usePurchases())
  await act(async () => {}) // flush useEffect → getOfferings
  return utils
}

// ─── Hook shape ───────────────────────────────────────────────────────────────

describe('usePurchases — shape', () => {
  it('exposes checkPremiumStatus, purchasePremium, restorePurchases', async () => {
    const { result } = await mountHook()
    expect(typeof result.current.checkPremiumStatus).toBe('function')
    expect(typeof result.current.purchasePremium).toBe('function')
    expect(typeof result.current.restorePurchases).toBe('function')
  })

  it('starts with purchaseState idle and no error', async () => {
    const { result } = await mountHook()
    expect(result.current.purchaseState).toBe('idle')
    expect(result.current.error).toBeNull()
  })

  it('loads offerings on mount', async () => {
    await mountHook()
    expect(mockPurchases.getOfferings).toHaveBeenCalledTimes(1)
  })

  it('exposes offerings after mount', async () => {
    const { result } = await mountHook()
    expect(result.current.offerings).not.toBeNull()
  })
})

// ─── checkPremiumStatus ───────────────────────────────────────────────────────

describe('checkPremiumStatus', () => {
  it('sets isPremium true in store when entitlement is active', async () => {
    mockPurchases.getCustomerInfo.mockResolvedValue(makeCustomerInfo(true))
    const { result } = await mountHook()
    await act(async () => { await result.current.checkPremiumStatus() })
    expect(store().isPremium).toBe(true)
  })

  it('sets isPremium false in store when no active entitlement', async () => {
    store().setIsPremium(true)
    mockPurchases.getCustomerInfo.mockResolvedValue(makeCustomerInfo(false))
    const { result } = await mountHook()
    await act(async () => { await result.current.checkPremiumStatus() })
    expect(store().isPremium).toBe(false)
  })

  it('does not throw when getCustomerInfo fails', async () => {
    mockPurchases.getCustomerInfo.mockRejectedValue(new Error('Network error'))
    const { result } = await mountHook()
    await expect(
      act(async () => { await result.current.checkPremiumStatus() }),
    ).resolves.not.toThrow()
  })
})

// ─── purchasePremium ──────────────────────────────────────────────────────────

describe('purchasePremium', () => {
  it('sets purchaseState to success on successful purchase', async () => {
    const { result } = await mountHook()
    await act(async () => { await result.current.purchasePremium(makePackage()) })
    expect(result.current.purchaseState).toBe('success')
  })

  it('sets isPremium true in store on successful purchase', async () => {
    const { result } = await mountHook()
    await act(async () => { await result.current.purchasePremium(makePackage()) })
    expect(store().isPremium).toBe(true)
  })

  it('sets purchaseState to cancelled when user cancels', async () => {
    mockPurchases.purchasePackage.mockRejectedValue({
      userCancelled: true,
      code: '1',
      message: 'cancelled',
    })
    const { result } = await mountHook()
    await act(async () => { await result.current.purchasePremium(makePackage()) })
    expect(result.current.purchaseState).toBe('cancelled')
  })

  it('sets purchaseState to error on purchase failure', async () => {
    mockPurchases.purchasePackage.mockRejectedValue({
      userCancelled: false,
      message: 'Payment failed',
    })
    const { result } = await mountHook()
    await act(async () => { await result.current.purchasePremium(makePackage()) })
    expect(result.current.purchaseState).toBe('error')
  })

  it('stores error message on purchase failure', async () => {
    mockPurchases.purchasePackage.mockRejectedValue({
      userCancelled: false,
      message: 'Payment declined',
    })
    const { result } = await mountHook()
    await act(async () => { await result.current.purchasePremium(makePackage()) })
    expect(result.current.error).toBe('Payment declined')
  })

  it('clears previous error before a new purchase attempt', async () => {
    mockPurchases.purchasePackage
      .mockRejectedValueOnce({ userCancelled: false, message: 'fail' })
      .mockResolvedValueOnce({ customerInfo: makeCustomerInfo(true) })
    const { result } = await mountHook()
    await act(async () => { await result.current.purchasePremium(makePackage()) })
    await act(async () => { await result.current.purchasePremium(makePackage()) })
    expect(result.current.error).toBeNull()
    expect(result.current.purchaseState).toBe('success')
  })
})

// ─── restorePurchases ─────────────────────────────────────────────────────────

describe('restorePurchases', () => {
  it('sets purchaseState to success when active premium is restored', async () => {
    mockPurchases.restorePurchases.mockResolvedValue(makeCustomerInfo(true))
    const { result } = await mountHook()
    await act(async () => { await result.current.restorePurchases() })
    expect(result.current.purchaseState).toBe('success')
  })

  it('sets isPremium true in store when premium is restored', async () => {
    mockPurchases.restorePurchases.mockResolvedValue(makeCustomerInfo(true))
    const { result } = await mountHook()
    await act(async () => { await result.current.restorePurchases() })
    expect(store().isPremium).toBe(true)
  })

  it('sets purchaseState to already_purchased when no premium found after restore', async () => {
    mockPurchases.restorePurchases.mockResolvedValue(makeCustomerInfo(false))
    const { result } = await mountHook()
    await act(async () => { await result.current.restorePurchases() })
    expect(result.current.purchaseState).toBe('already_purchased')
  })

  it('sets purchaseState to error when restore fails', async () => {
    mockPurchases.restorePurchases.mockRejectedValue(new Error('Restore failed'))
    const { result } = await mountHook()
    await act(async () => { await result.current.restorePurchases() })
    expect(result.current.purchaseState).toBe('error')
  })
})
