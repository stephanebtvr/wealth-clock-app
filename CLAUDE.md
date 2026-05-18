# CLAUDE.md — WealthClock

> **RÈGLE ABSOLUE** : Lis ce fichier intégralement avant d'écrire la moindre ligne de code.
> En cas de doute : demander, ne pas supposer.

---

## ⚡ CONTEXT SNAPSHOT — À LIRE EN 30 SECONDES

> Ce bloc remplace la relecture complète. Claude le met à jour après chaque session.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 CONTEXT SNAPSHOT — 2026-05-18
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉTAPE ACTUELLE   : Étape 11 — useMeetingCounter + meeting + MeetingCounter ✅ COMPLÉTÉE
DERNIÈRE ACTION  : 262/262 tests verts, typecheck+lint clean
FICHIERS TOUCHÉS : src/hooks/useMeetingCounter.ts, src/components/MeetingCounter.tsx,
                   app/meeting.tsx, app/_layout.tsx (+ BebasNeue font)
BLOQUANTS ACTIFS : aucun
DÉCISIONS PRISES : - useMeetingCounter : phase ('running'|'paused'|'stopped') au lieu de isRunning state
                     pour éviter setState en useEffect (isRunning dérivé : phase === 'running' && !!config)
                   - configRef.current mis à jour dans useEffect (pas pendant le rendu) → react-hooks/refs rule
                   - startRef initialisé à 0 (pas Date.now() pendant render) → react-hooks/purity rule
                   - resume() ajuste startRef pour préserver le temps accumulé avant la pause
                   - MeetingCounter : setNativeProps (zéro re-render) pour cost + timer
                   - meeting.tsx : 3 phases (config → active → reveal)
                   - @expo-google-fonts/bebas-neue installé, 'BebasNeue-Regular' chargé dans _layout.tsx
PROCHAINE ÉTAPE  : Étape 11b — receiptConverter + receipt-scanner + ReceiptLine
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔴 ERREURS CONNUES — NE PAS RÉPÉTER

> Vérifier ce registre avant tout code. L'alimenter dès qu'une erreur est résolue.

| # | Erreur | Cause | Fix appliqué |
|---|--------|-------|--------------|
| 1 | jest 30 incompatible avec jest-expo 55 | jest ^30 dans devDeps, jest-expo attend jest 29 | Pinné `jest: "^29.0.0"` + `@types/jest: "^29.0.0"` dans devDeps |
| 2 | `renderHook` RNTL crash "missing peer react-test-renderer" | `react-test-renderer` absent des devDeps | `npm i -D react-test-renderer@19.1.0` (même version que react) |
| 3 | `react-hooks/refs` lint error sur `useRef(...).current` en render (se répète à chaque composant Animated) | La règle interdit l'accès à `.current` pendant le rendu | **RÈGLE PERMANENTE** : toujours `useState(() => new Animated.Value(x))` pour les valeurs animées, jamais `useRef(new Animated.Value(x)).current` |
| 4 | `react-hooks/set-state-in-effect` sur setState synchrone dans useEffect | eslint-plugin-react-hooks v7 interdit setState au top-level d'un useEffect | Appeler setState UNIQUEMENT dans les event handlers (AppState, etc.), pas directement dans useEffect |

---

## 1. VISION PRODUIT

**WealthClock** — app mobile affichant en temps réel combien l'utilisateur gagne à la seconde. Conçue pour TikTok.

### Core loop
1. Saisie salaire annuel → choc immédiat
2. Compteur temps réel
3. 5 features virales → contenu TikTok récurrent
4. Partage → croissance organique

### Les 5 features virales

| Feature | Angle TikTok | Accès |
|---------|-------------|-------|
| **Compteur temps réel** | "Voilà ce que je gagne à la seconde" | Gratuit |
| **Comparateur de valeur** | "Ce café = X minutes de ta vie" | Premium |
| **Mode Meeting** | "Cette réunion a coûté X€ en temps réel" | Premium |
| **Comparateur de salaires** | "Moi vs SMIC vs Mbappé en direct" | Premium |
| **Temps libre en négatif** | "2h Netflix = X€ d'opportunité perdue" | Premium |
| **Wealth Snapshot** | Template partageable TikTok/Instagram | Premium |

### Philosophie UX
- Choc émotionnel immédiat dès le premier écran
- Dark mode par défaut, design minimaliste premium
- Zéro compte utilisateur, zéro email collecté

---

## 2. STACK TECHNIQUE

| Couche | Choix | Version |
|--------|-------|---------|
| Framework | React Native + Expo | SDK 54 |
| Langage | TypeScript strict | 5.x |
| Navigation | Expo Router (file-based) | v4 |
| State | Zustand | ^5 |
| Paiement | RevenueCat react-native-purchases | ^8 |
| Style | StyleSheet natif uniquement | — |
| Stockage sensible | expo-secure-store | — |
| Stockage non sensible | AsyncStorage | — |
| Capture écran | expo-view-shot | — |
| Monitoring | Sentry Expo | — |
| Tests | Jest + React Native Testing Library | — |

### INTERDITS absolus
- Aucune lib CSS-in-JS (styled-components, NativeWind, Tamagui…)
- Aucun appel réseau pour les calculs (100% local)
- Jamais `console.log` en production / clés API dans le code / données sensibles dans AsyncStorage

---

## 3. STRUCTURE DU PROJET

```
wealthclock/
├── app/
│   ├── (onboarding)/       welcome.tsx, salary-input.tsx
│   ├── (tabs)/             index.tsx, compare.tsx, history.tsx
│   ├── meeting.tsx / value-scanner.tsx / negative-time.tsx / snapshot.tsx
│   ├── paywall.tsx / settings.tsx / _layout.tsx
├── src/
│   ├── components/         CounterDisplay, EarningsCard, FeatureCard,
│   │                       MeetingCounter, ValueResult, SalaryCompare,
│   │                       NegativeCounter, SnapshotCard, ShareButton
│   ├── store/              wealthStore.ts
│   ├── hooks/              useEarningsCounter, useMeetingCounter,
│   │                       useNegativeCounter, usePurchases, useSecureStorage
│   ├── utils/              salaryCalculator, valueConverter, salaryProfiles,
│   │                       snapshotGenerator, formatCurrency, validators, constants
│   ├── types/index.ts / config/revenuecat.ts
├── __tests__/utils/
└── .env / .env.example / app.config.ts / eas.json / CLAUDE.md
```

---

## 4. LOGIQUE MÉTIER

### Constantes (`src/utils/constants.ts`)
```typescript
export const WORKING_DAYS_PER_YEAR = 218;
export const WORKING_HOURS_PER_DAY = 8;
export const WORKING_HOURS_PER_YEAR = 1744;
export const COUNTER_INTERVAL_MS = 100;
export const SMIC_ANNUAL = 21_203;
export const MEDIAN_SALARY_FRANCE = 26_500;
```

### `salaryCalculator.ts` — pures, jamais NaN/Infinity/négatif
```typescript
hourlyRate(annual) | minuteRate(annual) | secondRate(annual)
todayEarnings(annual, now?) | momentEarnings(annual, durationMinutes)
```

### `valueConverter.ts`
```typescript
type ValueResult = { price, workMinutes, workHours, workDays, label, comparison }
convertPriceToTime(price, annualSalary): ValueResult
// label: <30min→"X minutes" | 30min-8h→"Xh Xmin" | >8h→"X,X jours"
```

### `salaryProfiles.ts`
```typescript
type SalaryProfile = { id, name, emoji, annualSalary, category, source }
// Min 12 profils, sources documentées (INSEE/Forbes/L'Équipe/Glassdoor 2024)
// Catégories: "reference" | "celebrity" | "profession" | "ceo"
```

### Modes de calcul
| Mode | Description | Accès |
|------|-------------|-------|
| Travail uniquement | Actif 8h-18h, jours ouvrés | Gratuit |
| Annualisé 24/7 | Divise par 8760h | Premium |
| Manuel | "Je travaille maintenant" | Premium |

---

## 5. SÉCURITÉ

```typescript
// Salaire → expo-secure-store UNIQUEMENT (clé: 'wealthclock_salary_v1')
// Préférences → AsyncStorage (non sensible uniquement)
// Env: EXPO_PUBLIC_REVENUECAT_IOS_KEY | EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
//      EXPO_PUBLIC_SENTRY_DSN | EXPO_PUBLIC_ENV
// Réseau autorisé: RevenueCat SDK + Sentry crash reports
// RGPD: sendDefaultPii: false, aucune PII collectée
```

### Validation
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }
validateSalary(input)       // 1 000€ – 10 000 000€
validatePrice(input)        // 0,01€ – 10 000 000€
validateParticipants(input) // 1 – 1 000
validateDuration(input)     // 1 – 1 440 min
```

---

## 6. FEATURES — SPÉCIFICATIONS ESSENTIELLES

### 6.1 Compteur — PATTERN CRITIQUE (zéro re-render)
```typescript
// OBLIGATOIRE — ne jamais utiliser setState pour le compteur
const intervalRef = useRef<NodeJS.Timeout>();
const displayRef = useRef<TextInput>(null);
useEffect(() => {
  intervalRef.current = setInterval(() => {
    accumulated += secondRate / 10;
    displayRef.current?.setNativeProps({ text: formatCurrency(accumulated, 6) });
  }, COUNTER_INTERVAL_MS);
  return () => clearInterval(intervalRef.current);
}, [secondRate]);
// fontVariant: ['tabular-nums'] OBLIGATOIRE sur TOUS les compteurs
```

**Écran home** : Header + CounterDisplay (sans scroll) + 2 EarningsCards + Grille 2×2 FeatureCards + FAB ShareButton

### 6.2 Comparateur de valeur (Premium)
Input prix → suggestions [☕4€][🍕12€][👟120€][✈️450€] → ValueResult animé + barre progression + historique 10 scans

### 6.3 Mode Meeting (Premium)
`useMeetingCounter` : AppState listener, recalcule `(Date.now() - startedAt) / 1000` au retour foreground.
Config → Actif (Bebas Neue 80px rouge) → Reveal (count-up + comparaisons concrètes + haptics)

### 6.4 Comparateur de salaires (Premium)
Mon compteur + grid profils multi-select (max 3) + **1 seul setInterval global** pour N profils + ratio en direct + fun fact rotatif

### 6.5 Temps libre en négatif (Premium)
Activités: netflix_episode(45min), netflix_movie(120min), tiktok_scroll(temps réel), commute, gym(60min), cooking, shopping, custom.
Compteur rouge décrémenté → si tiktok: message méta auto-dérisoire

### 6.6 Wealth Snapshot (Premium)
SnapshotCard 1080×1920 : gradient #0A0A0F→#1C1C28 + 4 blocs stats + taux/seconde + "wealthclock.app" + grain overlay opacity 0.03

### 6.7 Life Cost Scanner (Premium)
Liste items (nom + prix) → ReceiptLine (prix → temps) → total + shockPhrase.
Presets: café 3€, baguette 1,20€, resto 14€, plein 80€, iPhone 1299€, loyer 1200€

---

## 7. MONÉTISATION

| Produit | ID RevenueCat | Prix |
|---------|---------------|------|
| Premium mensuel | `wealthclock_premium_monthly` | 2,99 €/mois |
| Premium annuel | `wealthclock_premium_annual` | 19,99 €/an |

**Paywall : bottom sheet UNIQUEMENT. Jamais au launch. Prix toujours dynamiques via RevenueCat.**
Déclencheurs par ordre de conversion : Mode Meeting → Comparateur Mbappé → Comparateur valeur → Wealth Snapshot

---

## 8. UX / DESIGN

### Palette
```typescript
export const Colors = {
  background: '#0A0A0F', surface: '#13131A', surfaceAlt: '#1C1C28',
  primary: '#00FF87',    primaryDim: '#00CC6A',
  gold: '#FFD700',       danger: '#FF4444',    dangerDim: '#CC0000',
  textPrimary: '#FFFFFF', textSecondary: '#8888AA', textTertiary: '#44445A',
  border: '#1E1E2E',
};
```

### Typographie
```typescript
// Space Mono Bold → compteurs (tabular-nums OBLIGATOIRE)
// Outfit → UI textes | Bebas Neue → grands chiffres Meeting + Négatif
counterStyle: { fontFamily: 'SpaceMono-Bold', fontSize: 72, fontVariant: ['tabular-nums'], letterSpacing: -2, color: Colors.primary }
meetingStyle: { fontFamily: 'BebasNeue-Regular', fontSize: 80, fontVariant: ['tabular-nums'], color: Colors.danger }
```

### Règles UX
- Compteur visible **sans scroll** sur TOUS les formats (iPhone SE → 15 Pro Max)
- Features en **1 tap** depuis home
- Feedback haptique sur chaque interaction importante

---

## 9. PERFORMANCE

```typescript
// CounterDisplay → setNativeProps (zéro re-render)
// React.memo() sur EarningsCard, FeatureCard, SalaryCompare
// useMeetingCounter → AppState listener (recalcul au retour foreground)
// salaryProfiles → objet statique (pas de recalcul)
// SalaryCompare → 1 seul setInterval global pour N profils simultanés
```

| Métrique | Objectif |
|----------|----------|
| Time to interactive | < 1,5s |
| Bundle JS | < 3 MB |
| RAM | < 80 MB |
| CPU idle (compteur) | < 5% |

---

## 10. TESTS

| Fichier | Couverture |
|---------|-----------|
| `salaryCalculator.ts` | **100%** |
| `valueConverter.ts` | **100%** |
| `salaryProfiles.ts` | **100%** |
| `formatCurrency.ts` | **100%** |
| `validators.ts` | **100%** |
| `useEarningsCounter.ts` | 80% |
| `useMeetingCounter.ts` | 80% |
| `usePurchases.ts` | 80% |

---

## 11. ORDRE DE DÉVELOPPEMENT STRICT

```
Étape 1  → Setup : create-expo-app + TypeScript strict + ESLint + Prettier
Étape 2  → Expo Router : toute la structure de navigation
Étape 3  → salaryCalculator + validators + formatCurrency + tests 100%
Étape 4  → valueConverter + tests 100%
Étape 5  → salaryProfiles + tests 100%
Étape 6  → Zustand store (wealthStore.ts)
Étape 7  → useSecureStorage + onboarding (welcome + salary-input)
Étape 8  → useEarningsCounter + CounterDisplay
Étape 9  → Écran home + FeatureCard + EarningsCard
Étape 10 → value-scanner + ValueResult
Étape 11 → useMeetingCounter + meeting + MeetingCounter
Étape 11b→ receiptConverter + receipt-scanner + ReceiptLine
Étape 12 → compare + SalaryCompare
Étape 13 → useNegativeCounter + negative-time + NegativeCounter
Étape 14 → snapshotGenerator + SnapshotCard + snapshot
Étape 15 → ShareButton (formats carré + 9:16)
Étape 16 → RevenueCat + usePurchases + paywall
Étape 17 → history + settings + Sentry + EAS Build
Étape 18 → Tests finaux + polish + build production
```

**Claude : confirmer la complétion d'une étape avant de passer à la suivante.**

---

## 12. CHECKLIST AVANT CHAQUE COMMIT

```
[ ] npm run typecheck → zéro erreur
[ ] npm run lint      → zéro warning
[ ] npm test          → 100% coverage logique métier
[ ] Aucun console.log / Aucune clé API / Salaire dans expo-secure-store / .env non commité
[ ] Section "ERREURS CONNUES" mise à jour si applicable
[ ] Context Snapshot mis à jour
```

---

## 13. CONFIGURATION

### `.env.example`
```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_SENTRY_DSN=https://XXXXXXXX@oXXXXXX.ingest.sentry.io/XXXXXXX
EXPO_PUBLIC_ENV=development
```

### Comptes requis
| Service | Coût |
|---------|------|
| Expo / EAS | Gratuit |
| RevenueCat | Gratuit < 2 500$/mois |
| Sentry | Gratuit |
| Apple Developer | 99$/an |
| Google Play Console | 25$ one-time |

### Intégration Superpowers — Skills actifs

> **Priorité** : CLAUDE.md > Superpowers skills > comportement par défaut.
> En cas de conflit entre un skill et ce fichier : ce CLAUDE.md gagne.

#### ✅ SKILL 1 — TDD (test-driven-development)
**Quand** : avant toute implémentation dans `src/utils/` ou `src/hooks/`

Règle de fer : **aucun code de production sans test échouant en premier.**
```
RED   → Écrire le test minimal. Le faire échouer volontairement.
GREEN → Écrire le code minimal pour le faire passer.
REFACTOR → Nettoyer sans ajouter de comportement.
```
- Fichiers concernés : `salaryCalculator`, `valueConverter`, `validators`, `formatCurrency`, `salaryProfiles`, `receiptConverter` → coverage **100% obligatoire**
- Hooks (`useEarningsCounter`, `useMeetingCounter`…) → coverage 80%
- Jamais : "je testerai après" / "c'est trop simple" / "j'explore d'abord"

#### ✅ SKILL 2 — Debugging systématique
**Quand** : à la première erreur ou comportement inattendu.

Règle de fer : **trouver la cause racine avant tout fix.**
```
Phase 1 : Lire les erreurs complètes. Reproduire. Tracer le flux de données.
Phase 2 : Trouver du code similaire qui fonctionne. Comparer les différences.
Phase 3 : Formuler UNE hypothèse. Tester le changement MINIMAL.
Phase 4 : Implémenter le fix. Vérifier. Ajouter au registre ERREURS CONNUES.
```
- Interdits : "quick fix pour l'instant", "essaie ça et vois", fixes sans comprendre
- Après chaque fix : ajouter au tableau ERREURS CONNUES (section 2 de ce fichier)

#### ✅ SKILL 3 — Code Review
**Quand** : après chaque étape complétée (section 11), avant de passer à la suivante.

Checklist obligatoire après chaque étape :
```
[ ] typecheck passe (zéro erreur)
[ ] lint passe (zéro warning)
[ ] tests passent au coverage requis
[ ] Aucun any implicite
[ ] Aucun console.log
[ ] Logique de l'étape cohérente avec CLAUDE.md
[ ] Context Snapshot mis à jour
```
- Si un point échoue → corriger avant de démarrer l'étape suivante
- Ne jamais "procéder quand même"

#### ❌ Skills NON utilisés pour ce projet
- `brainstorming.md` → remplacé par la section 1 (Vision) de ce fichier
- `writing-plans.md` → remplacé par la section 11 (Ordre de développement)
- `verification.md` → intégré dans la checklist section 12

---

## 14. PROTOCOLE COMPOUNDING ENGINEERING

> Ces règles permettent à Claude de **s'améliorer à chaque session** sans répéter les mêmes erreurs.

### Règle 1 — Lire avant d'agir
1. Lire le **Context Snapshot** (bloc en haut du fichier)
2. Lire le registre **ERREURS CONNUES**
3. Identifier l'étape courante (section 11)
4. Seulement ensuite : écrire du code

### Règle 2 — Mettre à jour après chaque réponse significative
À la fin de chaque réponse contenant du code ou une décision, Claude met à jour :
- Le **Context Snapshot** (étape actuelle, dernière action, fichiers touchés, bloquants, prochaine étape)
- Le registre **ERREURS CONNUES** si une erreur a été résolue

### Règle 3 — Format Context Snapshot de fin de session
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 CONTEXT SNAPSHOT — [DATE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ÉTAPE ACTUELLE   : Étape X — [nom]
DERNIÈRE ACTION  : [Ce qui a été fait]
FICHIERS TOUCHÉS : [liste courte]
BLOQUANTS ACTIFS : [aucun / description]
DÉCISIONS PRISES : [choix techniques importants]
PROCHAINE ÉTAPE  : Étape X+1 — [nom] — [premier geste à faire]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Règle 4 — Économie de tokens
- Ne jamais relire les sections 3–13 en entier si le Context Snapshot est à jour
- Ne citer que les extraits pertinents à la tâche en cours
- Reformuler toute question ambiguë avant de générer du code
- Écrire du code complet et fonctionnel (jamais de placeholders)

### Règle 5 — Anti-régression
Avant tout changement sur un fichier existant :
1. Vérifier si ce fichier est dans **ERREURS CONNUES**
2. Relire uniquement la fonction/le composant concerné (pas tout le fichier)
3. Ne pas modifier ce qui fonctionne déjà
