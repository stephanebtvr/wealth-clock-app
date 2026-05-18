# Prompt Claude Code — WealthClock

> À coller dans Claude Code au démarrage du projet.
> `CLAUDE.md` doit être placé à la racine avant de commencer.

---

## PROMPT PRINCIPAL

```
Tu es un expert React Native, Expo SDK 54, TypeScript strict et UX mobile.

Tu vas construire WealthClock de A à Z.

AVANT TOUTE CHOSE — PROTOCOLE COMPOUNDING ENGINEERING :
1. Lis le fichier CLAUDE.md à la racine dans son intégralité
2. Lis le "Context Snapshot" en haut du CLAUDE.md :
   → S'il est rempli, reprends là où la session précédente s'est arrêtée
   → S'il est vide, commence à l'Étape 1
3. Lis le registre "ERREURS CONNUES" du CLAUDE.md
   → Ne jamais reproduire une erreur déjà documentée
4. Confirme que tu as bien lu en citant :
   - L'étape actuelle selon le Context Snapshot
   - Les 5 features virales et leur accès (section 1)
   - Le pattern OBLIGATOIRE du compteur sans re-render (section 6.1)
   - La règle de stockage du salaire (section 5)
5. Ne génère pas une seule ligne de code avant cette confirmation

APRÈS CHAQUE RÉPONSE SIGNIFICATIVE :
- Mets à jour le Context Snapshot dans CLAUDE.md
- Ajoute toute nouvelle erreur résolue au registre "ERREURS CONNUES"
- Termine avec le bloc :
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📍 CONTEXT SNAPSHOT — [DATE]
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ÉTAPE ACTUELLE   : Étape X — [nom]
  DERNIÈRE ACTION  : [Ce qui a été fait]
  FICHIERS TOUCHÉS : [liste courte]
  BLOQUANTS ACTIFS : [aucun / description]
  DÉCISIONS PRISES : [choix techniques importants]
  PROCHAINE ÉTAPE  : Étape X+1 — [nom] — [premier geste]
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Contraintes non négociables :
- TypeScript strict, zéro any implicite
- Salaire stocké UNIQUEMENT dans expo-secure-store
- Compteur : setNativeProps sur TextInput ref (zéro re-render React)
- fontVariant: ['tabular-nums'] sur TOUS les compteurs
- Zéro appel réseau pour les calculs
- Chaque étape doit passer typecheck + lint avant validation
- Jamais de placeholder : code complet ou rien
```

---

## PROMPTS PAR ÉTAPE

---

### ÉTAPE 1 — Setup projet

```
Étape 1 : Setup du projet WealthClock.

Avant de commencer, relis le Context Snapshot du CLAUDE.md.

npx create-expo-app wealthclock --template blank-typescript

Configure :
1. tsconfig.json : strict: true + paths @/ → ./src/
2. ESLint @typescript-eslint/recommended + no-console: error
3. Prettier (semi: false, singleQuote: true, printWidth: 100)
4. .gitignore complet (.env, *.jks, *.p8, google-services.json, etc.)
5. .env.example avec les 4 variables de CLAUDE.md section 13
6. Scripts package.json : lint, typecheck, test, test:coverage
7. eas.json : profils development, preview, production

Montre la structure avec tree.
Confirme que typecheck et lint passent sans erreur.
Termine avec le Context Snapshot mis à jour.
```

---

### ÉTAPE 2 — Expo Router

```
Étape 2 : Structure de navigation complète.
(Vérifie d'abord le Context Snapshot du CLAUDE.md.)

Crée toute la structure app/ définie dans CLAUDE.md section 3.
Tous les écrans sont des placeholders vides pour l'instant.

Routing :
- Premier launch (pas de salaire) → (onboarding)/welcome
- Salaire configuré → (tabs)/index
- Features premium → modals : meeting, value-scanner, negative-time, snapshot
- Paywall → bottom sheet modal

AsyncStorage — flags non-sensibles uniquement :
- 'wealthclock_onboarding_done': boolean
- 'wealthclock_calc_mode': 'work_only' | 'annualized'
- 'wealthclock_value_history': ValueResult[] (10 derniers)
- 'wealthclock_moment_history': MomentRecord[] (20 derniers)
NE PAS stocker le salaire dans AsyncStorage.

Confirme compilation TypeScript sans erreur + Context Snapshot.
```

---

### ÉTAPE 3 — Logique pure de base

```
Étape 3 : salaryCalculator.ts + validators.ts + formatCurrency.ts
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

1. src/utils/constants.ts (voir CLAUDE.md section 4)

2. src/utils/validators.ts :
   - validateSalary / validatePrice / validateParticipants / validateDuration
   - Type Result<T,E> discriminant union

3. src/utils/salaryCalculator.ts :
   - hourlyRate / minuteRate / secondRate / todayEarnings / momentEarnings
   - Toutes pures, jamais NaN/Infinity/négatif

4. src/utils/formatCurrency.ts :
   - formatCurrency(amount, decimals?): string — Intl.NumberFormat 'fr-FR', 'EUR'
   - formatCurrencyCompact(amount): string

Tests 100% coverage sur les 3 fichiers.
Confirme le rapport de coverage + Context Snapshot.
```

---

### ÉTAPE 4 — Value Converter

```
Étape 4 : valueConverter.ts + tests 100%.
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

type ValueResult = {
  price, workMinutes, workHours, workDays,
  label, comparison, emoji
}

convertPriceToTime(price, annualSalary): ValueResult

Labels : <1min→"moins d'une minute" | 1-59min→"X minutes" | 1h-7h59→"Xh Xmin" | ≥8h→"X,X jours"
Comparison : <30min→"= une pause café" | 30-60min→"= une pause déjeuner" | 1h-4h→"= X% de ta journée" | 4h-8h→"= une demi-journée" | ≥8h→"= X journées"

Tests obligatoires :
- 6€ pour SMIC → ~17 minutes
- 6€ pour 50 000€/an → ~6 minutes
- 0,01€ → pas NaN | 10M€ → pas NaN/Infinity
- label correct pour chaque tranche

Confirme 100% coverage + Context Snapshot.
```

---

### ÉTAPE 5 — Salary Profiles

```
Étape 5 : salaryProfiles.ts + tests 100%.
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

Type SalaryProfile : { id, name, emoji, annualSalary, category, source }
Minimum 12 profils (référence/professions/célébrités/CEO), tous avec source documentée.
Catégories: "reference" | "celebrity" | "profession" | "ceo"

Expose : getProfileById / getProfilesByCategory / calculateProfileSecondRate

Tests : length >= 12, ids uniques, annualSalary > 0, source non vide,
SMIC_ANNUAL correct, Mbappé > 10 000 000, calculateProfileSecondRate jamais NaN.

Confirme 100% coverage + Context Snapshot.
```

---

### ÉTAPE 6 — Zustand Store

```
Étape 6 : wealthStore.ts avec Zustand v5.
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

State :
- salary: number | null | salaryType | calculationMode | isPremium
- isOnboardingCompleted | activeMeeting | activeNegativeActivity
- valueHistory: ValueResult[] (max 10, AsyncStorage)
- momentHistory: MomentRecord[] (max 20, AsyncStorage)

Actions : setSalary / setCalculationMode / setIsPremium / completeOnboarding /
startMeeting / stopMeeting / startNegativeActivity / stopNegativeActivity /
addValueResult / addMomentRecord / resetAll

Le store NE stocke PAS le salaire (rôle de expo-secure-store).
Il charge le salaire depuis SecureStore au démarrage.

Termine avec Context Snapshot.
```

---

### ÉTAPE 7 — SecureStorage + Onboarding

```
Étape 7 : useSecureStorage.ts + écrans onboarding.
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

1. useSecureStorage.ts :
   - saveSalary / loadSalary / deleteSalary
   - Clé : 'wealthclock_salary_v1'
   - Try/catch partout, jamais logger le salaire

2. welcome.tsx :
   - Compteur fictif "0,003 €/sec" qui pulse
   - Titre "WealthClock" + CTA "Calculer mon salaire" → salary-input
   - Fond #0A0A0F, vert néon

3. salary-input.tsx :
   - Input numérique + toggle brut/net
   - Validation temps réel (validateSalary), message inline
   - CTA "Voir mon compteur" désactivé si invalide
   - Submit : saveSalary() + setSalary() store + nav home
   - Haptics + mention "Votre salaire reste sur votre appareil"

Termine avec Context Snapshot.
```

---

### ÉTAPE 8 — Compteur principal

```
Étape 8 : useEarningsCounter.ts + CounterDisplay.tsx
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)
(ATTENTION : pattern critique défini en section 6.1 du CLAUDE.md)

useEarningsCounter.ts :
- Lit salary depuis le store
- setInterval 100ms, incrémente accumulateur via useRef (pas useState)
- AppState: pause background / recalcul retour foreground
- Expose : accumulatedToday, secondRate, minuteRate, hourlyRate

CounterDisplay.tsx :
- setNativeProps sur TextInput ref (JAMAIS setState)
- fontVariant: ['tabular-nums'] OBLIGATOIRE
- Space Mono Bold, 72px, couleur #00FF87
- Commente explicitement pourquoi setNativeProps est utilisé

Montre le code et explique comment les re-renders sont évités.
Termine avec Context Snapshot.
```

---

### ÉTAPE 9 — Écran Home + FeatureCards

```
Étape 9 : Écran home complet + FeatureCard.tsx + EarningsCard.tsx
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

app/(tabs)/index.tsx — structure obligatoire :
1. Header "WealthClock" (Outfit Bold, letter-spacing 2) + icône settings
2. CounterDisplay (sans scroll, toujours visible)
3. Row : EarningsCard "Cette heure" | EarningsCard "Aujourd'hui"
4. Grille 2×2 FeatureCards : [💰 Valeur réelle] [👥 Mode Réunion] [⏱️ Temps libre] [📸 Mon Snapshot]
5. FAB ShareButton (vert néon, bas droite)

EarningsCard.tsx : fond #13131A, border-radius 16, animation slide-in
FeatureCard.tsx : badge PREMIUM or + Haptics.impactAsync(LIGHT) + paywall si non premium

Règle : tout l'écran tient sans scroll sur iPhone SE (375×667).
Teste aussi iPhone 15 Pro Max (430×932).
Termine avec Context Snapshot.
```

---

### ÉTAPE 10 — Comparateur de Valeur

```
Étape 10 : value-scanner.tsx + ValueResult.tsx
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

value-scanner.tsx (modal) :
1. Header + input prix (validatePrice, symbole € à droite)
2. Chips rapides : [☕ 4€] [🍕 12€] [👟 120€] [✈️ 450€] [🚗 15 000€]
3. ValueResult animé (slide-up) : chiffre principal + comparison + barre progression
   → Rouge si > 1 jour, orange si > 4h, vert si < 1h
4. Historique 10 derniers scans
5. ShareButton → format carré 1080×1080

ValueResult.tsx : count-up depuis 0 (Animated.timing 600ms) + emoji contextuel

Termine avec Context Snapshot.
```

---

### ÉTAPE 11 — Mode Meeting

```
Étape 11 : useMeetingCounter.ts + meeting.tsx + MeetingCounter.tsx
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

useMeetingCounter.ts :
- MeetingConfig : { participants, averageSalary, startedAt }
- setInterval 100ms → currentCost = participants × minuteRate × elapsedMin
- AppState : au retour foreground → recalcule (Date.now() - startedAt.getTime()) / 1000
- Expose : currentCost, elapsedSeconds, isRunning, pause(), resume(), stop()

meeting.tsx (modal) :
CONFIG → ACTIF (Bebas Neue 80px rouge) → REVEAL (count-up 2s + Haptics.notificationAsync(ERROR))
Reveal : "Cette réunion aurait pu payer : X repas / X Netflix / X iPhones"
ShareButton → 9:16 TikTok

Termine avec Context Snapshot.
```

---

### ÉTAPE 11b — Life Cost Scanner

```
Étape 11b : receiptConverter.ts + receipt-scanner.tsx + ReceiptLine.tsx
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

receiptConverter.ts :
- ReceiptItem : { id, label, price }
- ReceiptResult : { items (avec workMinutes/label/emoji), total, totalWorkMinutes, totalLabel, shockPhrase }
- convertReceipt(items, annualSalary): ReceiptResult
- Réutilise convertPriceToTime() de valueConverter

Presets : ☕3€ / 🥖1,20€ / 🍽️14€ / ⛽80€ / 🛒120€ / 📱1299€

receipt-scanner.tsx (modal premium) :
1. Liste items éditables (ajout/suppression)
2. Chips presets en haut
3. ReceiptLine.tsx : React.memo, swipe left pour supprimer, highlight si > 1 jour
4. Total sticky en bas + shockPhrase
5. ShareButton → 9:16

Tests 100% sur receiptConverter.ts.
Termine avec Context Snapshot.
```

---

### ÉTAPE 12 — Comparateur de Salaires

```
Étape 12 : compare.tsx + SalaryCompare.tsx
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

compare.tsx (tab) :
1. Mon compteur personnel en haut (non interactif)
2. Tabs catégories : [Références] [Professions] [Célébrités] [CEO]
   Grid 2 colonnes, multi-select max 3, highlight vert néon
3. Comparaison en direct — taille proportionnelle au salaire :
   SMIC:24px | Médian:28px | Dev:32px | Mbappé:64px (effet "écrasant")
4. Ratio en direct : "Mbappé gagne 3 397x plus que toi/seconde"
5. Fun fact rotatif toutes les 10s (Animated.timing)
6. ShareButton

SalaryCompare.tsx : 1 seul setInterval global pour tous les profils (performance)
→ setNativeProps sur chaque TextInput ref (même pattern que CounterDisplay)

Termine avec Context Snapshot.
```

---

### ÉTAPE 13 — Temps Libre en Négatif

```
Étape 13 : useNegativeCounter.ts + negative-time.tsx + NegativeCounter.tsx
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

useNegativeCounter.ts :
- Mode "en direct" : setInterval qui décrémente en temps réel
- Mode "simulé" : calcule directement le montant pour une durée donnée
- AppState listener (même pattern que meeting)
- Expose : currentLoss, elapsedSeconds, isRunning, start(), stop()

negative-time.tsx (modal) :
1. Grid 2×4 activités (netflix_episode/netflix_movie/tiktok_scroll/commute/gym/cooking/shopping/custom)
2. NegativeCounter : Bebas Neue 80px ROUGE "−X,XX €"
3. Fun fact rotatif : % salaire journalier / repas / litres essence
4. [Si tiktok] message méta : "🤭 Ironique... cette vidéo t'a déjà coûté X€"
5. STOP → reveal total | ShareButton 9:16 fond rouge sombre

NegativeCounter.tsx : même pattern setNativeProps, couleur danger (#FF4444)
Termine avec Context Snapshot.
```

---

### ÉTAPE 14 — Wealth Snapshot

```
Étape 14 : snapshotGenerator.ts + SnapshotCard.tsx + snapshot.tsx
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

snapshotGenerator.ts :
type SnapshotData = { todayEarnings, weekEarnings, monthEarnings, yearEarnings, secondRate, minuteRate, hourlyRate, generatedAt }
generateSnapshotData(salary): SnapshotData — jamais NaN, jamais le salaire brut

SnapshotCard.tsx — capturé par expo-view-shot, dimensions fixes 1080×1920 :
- Gradient fond via LinearGradient (expo-linear-gradient)
- Logo "WealthClock" watermark haut (Outfit Bold, letter-spacing 4)
- 4 blocs stats 2×2 : Aujourd'hui | Semaine | Mois | Année
- Taux/seconde au centre (Space Mono Bold 48px, vert néon)
- Date + heure | "Calcule le tien → wealthclock.app" (or, italic)
- Overlay grain opacity 0.03

snapshot.tsx : captureRef → Share.share() + haptics
IMPORTANT : fond explicite backgroundColor: '#0A0A0F' obligatoire (pas de blanc)

Termine avec Context Snapshot.
```

---

### ÉTAPE 15 — ShareButton global

```
Étape 15 : ShareButton.tsx avec formats multiples.
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

Props : mode ('counter'|'value'|'meeting'|'negative'|'compare') + targetRef + customData?

Comportements : expo-view-shot.captureRef() + Share.share() + haptics + loading state
Mode meeting/negative → 9:16 | Mode counter/value/compare → carré

FAB style (home) : fond #00FF87, position absolute bottom 24 right 24, animation pulse 5s

Dans TOUS les cas : quality 1, format 'png', message inclut "WealthClock"
Termine avec Context Snapshot.
```

---

### ÉTAPE 16 — RevenueCat + Paywall

```
Étape 16 : RevenueCat + usePurchases.ts + paywall.tsx
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

1. Purchases.configure() dans app/_layout.tsx (avant checkPremiumStatus)
   Clés depuis EXPO_PUBLIC_REVENUECAT_*

2. usePurchases.ts :
   - checkPremiumStatus() → setIsPremium() dans le store
   - purchasePremium(productId) / restorePurchases()
   - États : loading, error, cancelled, success, already_purchased
   - Toujours vérifier RevenueCat au launch (pas le state local seul)

3. paywall.tsx (bottom sheet 85%) :
   - 6 features listées avec icônes
   - Deux options : Mensuel | Annuel (mis en avant, fond vert)
   - Prix dynamiques via RevenueCat (jamais hard-codés)
   - CTA "Déverrouiller Premium" + "Restaurer mes achats"

FeatureCard : tap → router.push('/paywall') si non premium
Termine avec Context Snapshot.
```

---

### ÉTAPE 17 — Finitions

```
Étape 17 : history + settings + Sentry + EAS Build
(Vérifie d'abord le Context Snapshot et les ERREURS CONNUES du CLAUDE.md.)

1. history.tsx (3ème tab) :
   - "Valeurs calculées" (10 derniers scans) + "Moments calculés" (20 derniers)
   - Swipe left pour supprimer | Placeholder si vide

2. settings.tsx :
   - Modifier salaire + mode de calcul + restaurer achats
   - Vider historique (confirmation) + CGU + version app

3. Sentry :
   - sendDefaultPii: false
   - beforeSend : ne jamais inclure la valeur du salaire

4. EAS Build :
   - Vérifier app.config.ts (bundleId, plugins)
   - Secrets EAS pour clés RevenueCat
   - Build preview Android (APK) pour test device

5. Checklist finale CLAUDE.md section 12
Termine avec Context Snapshot.
```

---

## PROMPTS DE DÉBOGAGE

### Si le compteur saccade ou lag

```
Le compteur saccade. Vérifie dans l'ordre (consulte aussi les ERREURS CONNUES du CLAUDE.md) :
1. CounterDisplay utilise-t-il setNativeProps ou setState ?
   → Si setState : refactore immédiatement avec setNativeProps + useRef TextInput
2. Le parent de CounterDisplay se re-render-il à chaque tick ?
   → Ajouter React.memo() sur CounterDisplay et ses siblings
3. fontVariant: ['tabular-nums'] est-il bien appliqué ?
4. L'interval est-il bien de 100ms ? Y a-t-il plusieurs intervals actifs ?
   → Vérifier le cleanup dans le return du useEffect
Montre CounterDisplay.tsx et useEarningsCounter.ts.
Ajoute la cause et le fix dans ERREURS CONNUES du CLAUDE.md.
```

### Si le Meeting counter ne reprend pas après background

```
Le compteur Meeting se remet à zéro après background. Vérifie (+ ERREURS CONNUES) :
1. AppState.addEventListener('change') est-il configuré dans useMeetingCounter ?
2. Au retour 'active' : recalcule-t-on (Date.now() - startedAt.getTime()) / 1000 ?
3. startedAt est-il dans un ref (pas dans le state) ?
4. Le cleanup du listener est-il dans le return du useEffect ?
Montre useMeetingCounter.ts complet.
Ajoute la cause et le fix dans ERREURS CONNUES du CLAUDE.md.
```

### Si le comparateur de salaires lag avec plusieurs profils

```
SalaryCompare lag avec 3 profils. Vérifie (+ ERREURS CONNUES) :
1. Y a-t-il 1 setInterval global ou 1 par profil ?
   → Doit être 1 seul interval global qui met à jour tous les refs
2. Chaque profil a-t-il bien son propre TextInput ref ?
3. Les calculs sont-ils faits dans l'interval ou dans le render ?
   → Doivent être dans l'interval uniquement
Montre SalaryCompare.tsx + pattern refs.
Ajoute la cause et le fix dans ERREURS CONNUES du CLAUDE.md.
```

### Si expo-view-shot capture une vue blanche

```
Le snapshot est tout blanc. Vérifie (+ ERREURS CONNUES) :
1. SnapshotCard.tsx a-t-il backgroundColor: '#0A0A0F' explicite ?
   → expo-view-shot ne capture pas les fonds transparents
2. captureRef() reçoit-il bien le ref de la View, pas un TextInput ?
3. La View est-elle bien rendue avant capture ?
   → Attendre : setTimeout(() => capture(), 100)
4. Sur Android : LinearGradient est-il bien supporté ?
Montre snapshot.tsx et SnapshotCard.tsx.
Ajoute la cause et le fix dans ERREURS CONNUES du CLAUDE.md.
```

### Si RevenueCat ne détecte pas le statut premium

```
isPremium reste false après achat. Vérifie (+ ERREURS CONNUES) :
1. Purchases.configure() est-il appelé AVANT checkPremiumStatus() ?
2. checkPremiumStatus() est-il appelé au mount du root layout ?
3. Sur simulateur iOS : les achats ne fonctionnent pas → tester sur device physique
4. Le produit 'wealthclock_premium_monthly' est-il dans le RC dashboard ?
5. Tester restorePurchases() manuellement
Montre usePurchases.ts et la config RC.
Ajoute la cause et le fix dans ERREURS CONNUES du CLAUDE.md.
```

### Si le salaire est perdu après fermeture

```
Le salaire disparaît au redémarrage. Vérifie (+ ERREURS CONNUES) :
1. saveSalary() utilise bien expo-secure-store (pas AsyncStorage) ?
2. loadSalary() est-il appelé dans _layout.tsx au mount ?
3. Le store setSalary() est-il appelé après loadSalary() ?
4. Sur Android emulator : configurer un PIN ou tester sur device physique
Montre useSecureStorage.ts et l'init dans _layout.tsx.
Ajoute la cause et le fix dans ERREURS CONNUES du CLAUDE.md.
```

---

## RÈGLE DE FIN DE SESSION

> **Claude doit systématiquement terminer chaque session avec le bloc Context Snapshot complet.**
> Ce bloc doit être copié dans le CLAUDE.md pour la session suivante.

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
