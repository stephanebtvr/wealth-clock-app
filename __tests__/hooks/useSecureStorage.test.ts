import { renderHook } from '@testing-library/react-native'
import { useSecureStorage } from '../../src/hooks/useSecureStorage'

// ─── Mock expo-secure-store ───────────────────────────────────────────────────

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))

import * as SecureStore from 'expo-secure-store'

const mockSet = SecureStore.setItemAsync as jest.Mock
const mockGet = SecureStore.getItemAsync as jest.Mock
const mockDel = SecureStore.deleteItemAsync as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockSet.mockResolvedValue(undefined)
  mockGet.mockResolvedValue(null)
  mockDel.mockResolvedValue(undefined)
})

// ─── Hook shape ───────────────────────────────────────────────────────────────

describe('useSecureStorage — shape', () => {
  it('returns saveSalary, loadSalary, deleteSalary', () => {
    const { result } = renderHook(() => useSecureStorage())
    expect(typeof result.current.saveSalary).toBe('function')
    expect(typeof result.current.loadSalary).toBe('function')
    expect(typeof result.current.deleteSalary).toBe('function')
  })
})

// ─── saveSalary ───────────────────────────────────────────────────────────────

describe('useSecureStorage — saveSalary', () => {
  it('calls SecureStore.setItemAsync with key wealthclock_salary_v1', async () => {
    const { result } = renderHook(() => useSecureStorage())
    await result.current.saveSalary(50_000)
    expect(mockSet).toHaveBeenCalledWith('wealthclock_salary_v1', expect.any(String))
  })

  it('stores the salary as a string', async () => {
    const { result } = renderHook(() => useSecureStorage())
    await result.current.saveSalary(50_000)
    expect(mockSet).toHaveBeenCalledWith('wealthclock_salary_v1', '50000')
  })

  it('returns void on success', async () => {
    const { result } = renderHook(() => useSecureStorage())
    const r = await result.current.saveSalary(50_000)
    expect(r).toBeUndefined()
  })

  it('does not throw when SecureStore throws', async () => {
    mockSet.mockRejectedValueOnce(new Error('SecureStore unavailable'))
    const { result } = renderHook(() => useSecureStorage())
    await expect(result.current.saveSalary(50_000)).resolves.not.toThrow()
  })

  it('does NOT log the salary value', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const { result } = renderHook(() => useSecureStorage())
    await result.current.saveSalary(50_000)
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

// ─── loadSalary ───────────────────────────────────────────────────────────────

describe('useSecureStorage — loadSalary', () => {
  it('calls SecureStore.getItemAsync with key wealthclock_salary_v1', async () => {
    const { result } = renderHook(() => useSecureStorage())
    await result.current.loadSalary()
    expect(mockGet).toHaveBeenCalledWith('wealthclock_salary_v1')
  })

  it('returns parsed number when stored value exists', async () => {
    mockGet.mockResolvedValueOnce('50000')
    const { result } = renderHook(() => useSecureStorage())
    const salary = await result.current.loadSalary()
    expect(salary).toBe(50_000)
  })

  it('returns null when no value stored', async () => {
    mockGet.mockResolvedValueOnce(null)
    const { result } = renderHook(() => useSecureStorage())
    const salary = await result.current.loadSalary()
    expect(salary).toBeNull()
  })

  it('returns null for non-numeric stored value', async () => {
    mockGet.mockResolvedValueOnce('not-a-number')
    const { result } = renderHook(() => useSecureStorage())
    const salary = await result.current.loadSalary()
    expect(salary).toBeNull()
  })

  it('returns null when SecureStore throws', async () => {
    mockGet.mockRejectedValueOnce(new Error('SecureStore unavailable'))
    const { result } = renderHook(() => useSecureStorage())
    const salary = await result.current.loadSalary()
    expect(salary).toBeNull()
  })

  it('does not throw when SecureStore throws', async () => {
    mockGet.mockRejectedValueOnce(new Error('SecureStore unavailable'))
    const { result } = renderHook(() => useSecureStorage())
    await expect(result.current.loadSalary()).resolves.not.toThrow()
  })
})

// ─── deleteSalary ─────────────────────────────────────────────────────────────

describe('useSecureStorage — deleteSalary', () => {
  it('calls SecureStore.deleteItemAsync with key wealthclock_salary_v1', async () => {
    const { result } = renderHook(() => useSecureStorage())
    await result.current.deleteSalary()
    expect(mockDel).toHaveBeenCalledWith('wealthclock_salary_v1')
  })

  it('returns void on success', async () => {
    const { result } = renderHook(() => useSecureStorage())
    const r = await result.current.deleteSalary()
    expect(r).toBeUndefined()
  })

  it('does not throw when SecureStore throws', async () => {
    mockDel.mockRejectedValueOnce(new Error('SecureStore unavailable'))
    const { result } = renderHook(() => useSecureStorage())
    await expect(result.current.deleteSalary()).resolves.not.toThrow()
  })
})
