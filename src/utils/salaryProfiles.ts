import type { SalaryProfile } from '../types'
import { SMIC_ANNUAL, MEDIAN_SALARY_FRANCE } from './constants'
import { secondRate } from './salaryCalculator'

export const SALARY_PROFILES: SalaryProfile[] = [
  // ─── Référence ────────────────────────────────────────────────────────────
  {
    id: 'smic',
    name: 'SMIC',
    emoji: '📊',
    annualSalary: SMIC_ANNUAL,
    category: 'reference',
    source: 'DARES — Salaire minimum 2024',
  },
  {
    id: 'median_france',
    name: 'Médiane France',
    emoji: '📈',
    annualSalary: MEDIAN_SALARY_FRANCE,
    category: 'reference',
    source: 'INSEE — Salaires et revenus du travail 2024',
  },

  // ─── Professions ──────────────────────────────────────────────────────────
  {
    id: 'caissier',
    name: 'Caissier·ère',
    emoji: '🛒',
    annualSalary: 21_500,
    category: 'profession',
    source: 'Glassdoor France 2024',
  },
  {
    id: 'infirmier',
    name: 'Infirmier·ère',
    emoji: '🏥',
    annualSalary: 27_000,
    category: 'profession',
    source: 'DARES — Enquête emploi 2024',
  },
  {
    id: 'professeur',
    name: 'Professeur des écoles',
    emoji: '📚',
    annualSalary: 32_000,
    category: 'profession',
    source: 'Ministère Éducation Nationale 2024',
  },
  {
    id: 'avocat',
    name: 'Avocat',
    emoji: '⚖️',
    annualSalary: 72_000,
    category: 'profession',
    source: 'Conseil National des Barreaux 2024',
  },
  {
    id: 'dev_senior',
    name: 'Développeur Senior',
    emoji: '💻',
    annualSalary: 58_000,
    category: 'profession',
    source: 'Glassdoor France 2024',
  },
  {
    id: 'medecin',
    name: 'Médecin généraliste',
    emoji: '👨‍⚕️',
    annualSalary: 85_000,
    category: 'profession',
    source: 'CNAM — Revenus des médecins libéraux 2024',
  },
  {
    id: 'pilote',
    name: 'Pilote de ligne',
    emoji: '✈️',
    annualSalary: 95_000,
    category: 'profession',
    source: 'SNPL — Syndicat National des Pilotes de Ligne 2024',
  },

  // ─── Célébrités ───────────────────────────────────────────────────────────
  {
    id: 'mbappe',
    name: 'Kylian Mbappé',
    emoji: '⚽',
    annualSalary: 72_000_000,
    category: 'celebrity',
    source: "L'Équipe — Contrat Real Madrid 2024",
  },
  {
    id: 'aya_nakamura',
    name: 'Aya Nakamura',
    emoji: '🎵',
    annualSalary: 4_000_000,
    category: 'celebrity',
    source: 'Forbes France — Célébrités 2024',
  },
  {
    id: 'omar_sy',
    name: 'Omar Sy',
    emoji: '🎬',
    annualSalary: 5_000_000,
    category: 'celebrity',
    source: 'Forbes France — Acteurs les mieux payés 2024',
  },

  // ─── PDG ──────────────────────────────────────────────────────────────────
  {
    id: 'arnault',
    name: 'Bernard Arnault (LVMH)',
    emoji: '👔',
    annualSalary: 15_000_000,
    category: 'ceo',
    source: 'Challenges — Rémunérations des dirigeants CAC 40 2024',
  },
  {
    id: 'tavares',
    name: 'Carlos Tavares (Stellantis)',
    emoji: '🚗',
    annualSalary: 36_000_000,
    category: 'ceo',
    source: 'Le Figaro — Rémunérations des PDG 2024',
  },
]

export function getProfileById(id: string): SalaryProfile | undefined {
  return SALARY_PROFILES.find((p) => p.id === id)
}

export function getProfilesByCategory(category: SalaryProfile['category']): SalaryProfile[] {
  return SALARY_PROFILES.filter((p) => p.category === category)
}

export function calculateProfileSecondRate(profile: SalaryProfile): number {
  return secondRate(profile.annualSalary)
}
