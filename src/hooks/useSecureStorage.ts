import * as SecureStore from 'expo-secure-store'

const SALARY_KEY = 'wealthclock_salary_v1'

export function useSecureStorage() {
  const saveSalary = async (salary: number): Promise<void> => {
    try {
      await SecureStore.setItemAsync(SALARY_KEY, String(salary))
    } catch {}
  }

  const loadSalary = async (): Promise<number | null> => {
    try {
      const raw = await SecureStore.getItemAsync(SALARY_KEY)
      if (!raw) return null
      const parsed = Number(raw)
      return Number.isFinite(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  const deleteSalary = async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(SALARY_KEY)
    } catch {}
  }

  return { saveSalary, loadSalary, deleteSalary }
}
