# Guide de démarrage — WealthClock avec Claude Code

> Ce guide explique comment construire WealthClock étape par étape.
> Chaque étape = un prompt distinct dans Claude Code.
> **Ne jamais lancer l'étape suivante avant validation de la précédente.**

---

## 📋 Avant de commencer — Checklist de préparation

```
[ ] Claude Code installé (npm i -g @anthropic-ai/claude-code)
[ ] CLAUDE.md est à la racine du dossier wealth-clock/
[ ] PROMPT_CLAUDECODE.md est à la racine du dossier wealth-clock/
[ ] Comptes créés : Expo / RevenueCat / Sentry / Apple Developer
[ ] Variables d'env notées quelque part (clés RevenueCat, DSN Sentry)
```

---

## 🚀 DÉMARRAGE — Prompt d'initialisation

**C'est le seul prompt à coller manuellement. Il initialise tout le protocole.**

Ouvre Claude Code dans le dossier `wealth-clock/`, puis colle :

```
Tu es un expert React Native, Expo SDK 54, TypeScript strict et UX mobile.

Tu vas construire WealthClock de A à Z.

PROTOCOLE OBLIGATOIRE AVANT TOUT :
1. Lis le fichier CLAUDE.md à la racine dans son intégralité
2. Lis le Context Snapshot en haut du CLAUDE.md :
   → S'il est rempli, reprends là où la session précédente s'est arrêtée
   → S'il est vide, commence à l'Étape 1
3. Lis le registre "ERREURS CONNUES" du CLAUDE.md
4. Confirme que tu as bien lu en citant :
   - L'étape actuelle (Context Snapshot)
   - Les 5 features virales et leur accès (section 1)
   - Le pattern compteur sans re-render (section 6.1)
   - La règle de stockage du salaire (section 5)
5. Ne génère pas une seule ligne de code avant cette confirmation

APRÈS CHAQUE RÉPONSE :
- Mets à jour le Context Snapshot dans CLAUDE.md
- Alimente le registre ERREURS CONNUES si un fix a été trouvé
- Termine avec le bloc Context Snapshot standardisé (section 14 du CLAUDE.md)

Contraintes non négociables :
- TypeScript strict, zéro any implicite
- Salaire uniquement dans expo-secure-store
- Compteur : setNativeProps sur TextInput ref (zéro re-render)
- fontVariant: ['tabular-nums'] sur TOUS les compteurs
- Zéro appel réseau pour les calculs
- Code complet — jamais de placeholder
```

**Attends la confirmation de lecture avant de continuer.**

---

## 📦 ÉTAPES — Ordre strict

### ✅ Étape 1 — Setup projet

**Prompt** : copie le bloc `ÉTAPE 1` du fichier `PROMPT_CLAUDECODE.md`

**Critères de validation avant de passer à l'étape 2 :**

```
[ ] npx create-expo-app exécuté sans erreur
[ ] tsconfig.json → strict: true configuré
[ ] ESLint + Prettier configurés, npm run lint passe
[ ] npm run typecheck passe (zéro erreur)
[ ] eas.json créé avec 3 profils
[ ] .env.example présent avec les 4 variables
[ ] Structure confirmée avec tree
[ ] Context Snapshot mis à jour dans CLAUDE.md
```

---

### ✅ Étape 2 — Navigation Expo Router

**Prompt** : copie le bloc `ÉTAPE 2` du fichier `PROMPT_CLAUDECODE.md`

**Critères de validation :**

```
[ ] Toute la structure app/ créée (voir section 3 de CLAUDE.md)
[ ] Routing logique : onboarding si pas de salaire, tabs sinon
[ ] Placeholder vides compilent sans erreur TypeScript
[ ] AsyncStorage : uniquement préférences non sensibles
[ ] npm run typecheck passe
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 3 — Logique pure + Tests 100%

**Prompt** : copie le bloc `ÉTAPE 3` du fichier `PROMPT_CLAUDECODE.md`

> ⚠️ **TDD obligatoire ici** : les tests s'écrivent AVANT le code.

**Critères de validation :**

```
[ ] constants.ts créé avec les 6 constantes exactes de CLAUDE.md
[ ] validators.ts : 4 fonctions avec type Result<T,E>
[ ] salaryCalculator.ts : 5 fonctions pures (jamais NaN/Infinity/négatif)
[ ] formatCurrency.ts : Intl.NumberFormat fr-FR EUR
[ ] npm test --coverage → 100% sur ces 3 fichiers
[ ] npm run typecheck passe
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 4 — Value Converter

**Prompt** : copie le bloc `ÉTAPE 4` du fichier `PROMPT_CLAUDECODE.md`

> ⚠️ **TDD obligatoire** : tester les 5 cas listés dans le prompt avant d'implémenter.

**Critères de validation :**

```
[ ] convertPriceToTime() couvre toutes les tranches de durée
[ ] Labels corrects pour chaque tranche (<1min, 1-59min, 1h-8h, ≥8h)
[ ] 6€ pour SMIC → ~17 minutes (pas NaN)
[ ] 0,01€ et 10M€ → pas NaN/Infinity
[ ] npm test --coverage → 100%
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 5 — Salary Profiles

**Prompt** : copie le bloc `ÉTAPE 5` du fichier `PROMPT_CLAUDECODE.md`

**Critères de validation :**

```
[ ] Minimum 12 profils avec source documentée non vide
[ ] Toutes les catégories représentées (reference/celebrity/profession/ceo)
[ ] SMIC_ANNUAL correspond à la constante (21 203)
[ ] Mbappé annualSalary > 10 000 000
[ ] getProfileById / getProfilesByCategory / calculateProfileSecondRate fonctionnent
[ ] npm test --coverage → 100%
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 6 — Zustand Store

**Prompt** : copie le bloc `ÉTAPE 6` du fichier `PROMPT_CLAUDECODE.md`

**Critères de validation :**

```
[ ] wealthStore.ts avec Zustand v5
[ ] Salary NON stocké dans le store (rôle de SecureStore)
[ ] Store charge le salaire depuis SecureStore au démarrage
[ ] valueHistory max 10 / momentHistory max 20 (avec AsyncStorage)
[ ] Toutes les actions définies et typées
[ ] npm run typecheck passe
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 7 — SecureStorage + Onboarding

**Prompt** : copie le bloc `ÉTAPE 7` du fichier `PROMPT_CLAUDECODE.md`

**Critères de validation :**

```
[ ] useSecureStorage.ts : saveSalary/loadSalary/deleteSalary avec try/catch
[ ] Clé 'wealthclock_salary_v1' utilisée (pas d'autre)
[ ] La valeur du salaire n'est JAMAIS loggée
[ ] welcome.tsx : animation compteur fictif + CTA fonctionnel
[ ] salary-input.tsx : validation temps réel + message inline + haptics
[ ] Navigation onboarding → home fonctionne
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 8 — Compteur principal (CRITIQUE)

**Prompt** : copie le bloc `ÉTAPE 8` du fichier `PROMPT_CLAUDECODE.md`

> ⚠️ **Étape la plus critique** : le pattern setNativeProps doit être parfait.
> Si le compteur saccade → utiliser le prompt de débogage "Si le compteur saccade".

**Critères de validation :**

```
[ ] CounterDisplay utilise setNativeProps (JAMAIS setState)
[ ] useRef<TextInput> pour la référence display
[ ] fontVariant: ['tabular-nums'] présent
[ ] Space Mono Bold 72px couleur #00FF87
[ ] AppState listener : pause en background, recalcul au retour
[ ] Zéro re-render visible du composant parent
[ ] Claude explique explicitement pourquoi setNativeProps est utilisé
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 9 — Écran Home + FeatureCards

**Prompt** : copie le bloc `ÉTAPE 9` du fichier `PROMPT_CLAUDECODE.md`

**Critères de validation :**

```
[ ] Header + CounterDisplay visible sans scroll sur iPhone SE (375×667)
[ ] 2 EarningsCards : "Cette heure" + "Aujourd'hui"
[ ] Grille 2×2 FeatureCards avec badges PREMIUM dorés
[ ] FAB ShareButton vert néon, bas droite
[ ] Tap feature → paywall si non premium (pas de crash)
[ ] Haptics.impactAsync(LIGHT) au tap FeatureCard
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 10 — Comparateur de Valeur

**Prompt** : copie le bloc `ÉTAPE 10` du fichier `PROMPT_CLAUDECODE.md`

**Critères de validation :**

```
[ ] Input prix avec validation temps réel (validatePrice)
[ ] 5 chips rapides fonctionnels
[ ] ValueResult animé (slide-up + count-up 600ms)
[ ] Barre de progression colorée (rouge/orange/vert selon durée)
[ ] Historique 10 derniers scans en AsyncStorage
[ ] ShareButton → format carré
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 11 — Mode Meeting

**Prompt** : copie le bloc `ÉTAPE 11` du fichier `PROMPT_CLAUDECODE.md`

> ⚠️ AppState listener obligatoire (recalcul au retour foreground).
> Si le compteur se remet à zéro après background → prompt de débogage "Meeting counter".

**Critères de validation :**

```
[ ] useMeetingCounter : AppState listener + (Date.now() - startedAt) / 1000
[ ] startedAt stocké dans un ref (pas dans le state)
[ ] 3 états : CONFIG / ACTIF / REVEAL
[ ] Coût en Bebas Neue 80px rouge
[ ] Reveal : count-up + Haptics.notificationAsync(ERROR) + 3 comparaisons
[ ] ShareButton 9:16
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 11b — Life Cost Scanner

**Prompt** : copie le bloc `ÉTAPE 11b` du fichier `PROMPT_CLAUDECODE.md`

**Critères de validation :**

```
[ ] receiptConverter.ts : tests 100% (café/iPhone/liste vide/shockPhrase)
[ ] 6 presets fonctionnels en chips
[ ] ReceiptLine.tsx : React.memo + swipe left pour supprimer
[ ] Highlight danger si ligne > 1 jour de travail
[ ] Total sticky + shockPhrase mis à jour en temps réel
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 12 — Comparateur de Salaires (PERFORMANCE CRITIQUE)

**Prompt** : copie le bloc `ÉTAPE 12` du fichier `PROMPT_CLAUDECODE.md`

> ⚠️ **1 seul setInterval global** pour N profils — jamais 1 par profil.
> Si ça lag → prompt de débogage "comparateur de salaires lag".

**Critères de validation :**

```
[ ] 1 seul setInterval pour tous les compteurs simultanés
[ ] setNativeProps sur chaque TextInput ref (même pattern que CounterDisplay)
[ ] Taille texte proportionnelle au salaire (SMIC 24px → Mbappé 64px)
[ ] Ratio en direct mis à jour chaque seconde
[ ] Fun fact rotatif toutes les 10s
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 13 — Temps Libre en Négatif

**Prompt** : copie le bloc `ÉTAPE 13` du fichier `PROMPT_CLAUDECODE.md`

**Critères de validation :**

```
[ ] 8 activités disponibles dont tiktok_scroll en temps réel
[ ] Mode "en direct" et mode "simulé" fonctionnels
[ ] Compteur Bebas Neue 80px rouge "−X,XX €"
[ ] Message méta si tiktok_scroll : mis à jour en temps réel
[ ] AppState listener (même pattern que Meeting)
[ ] ShareButton 9:16 fond rouge sombre
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 14 — Wealth Snapshot

**Prompt** : copie le bloc `ÉTAPE 14` du fichier `PROMPT_CLAUDECODE.md`

> ⚠️ `backgroundColor: '#0A0A0F'` OBLIGATOIRE sur SnapshotCard (sinon capture blanche).
> Si snapshot blanc → prompt de débogage "expo-view-shot blanc".

**Critères de validation :**

```
[ ] generateSnapshotData() : jamais NaN, jamais le salaire brut
[ ] SnapshotCard.tsx : dimensions fixes 1080×1920
[ ] backgroundColor explicite sur la View capturée
[ ] LinearGradient + overlay grain opacity 0.03
[ ] captureRef() → Share.share() + haptics
[ ] Note "Aucune donnée personnelle dans l'image"
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 15 — ShareButton global

**Prompt** : copie le bloc `ÉTAPE 15` du fichier `PROMPT_CLAUDECODE.md`

**Critères de validation :**

```
[ ] 5 modes : counter / value / meeting / negative / compare
[ ] quality: 1, format: 'png' partout
[ ] Loading state pendant la capture
[ ] Haptics.impactAsync(MEDIUM) avant capture
[ ] FAB pulse animation toutes les 5s sur l'écran home
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 16 — RevenueCat + Paywall

**Prompt** : copie le bloc `ÉTAPE 16` du fichier `PROMPT_CLAUDECODE.md`

> ⚠️ Tester sur device physique — le simulateur iOS ne gère pas les achats.

**Critères de validation :**

```
[ ] Purchases.configure() AVANT checkPremiumStatus() dans _layout.tsx
[ ] Prix dynamiques via RevenueCat (jamais hard-codés)
[ ] Paywall en bottom sheet 85% (jamais plein écran)
[ ] Annuel mis en avant (fond vert)
[ ] États : loading / error / cancelled / success / already_purchased
[ ] FeatureCard → paywall si non premium
[ ] Context Snapshot mis à jour
```

---

### ✅ Étape 17 — Finitions

**Prompt** : copie le bloc `ÉTAPE 17` du fichier `PROMPT_CLAUDECODE.md`

**Critères de validation :**

```
[ ] history.tsx : 2 sections + swipe to delete + placeholder si vide
[ ] settings.tsx : modifier salaire + mode calcul + restaurer achats + CGU
[ ] Sentry : sendDefaultPii: false + beforeSend sans salaire
[ ] EAS Build : app.config.ts + secrets + build preview Android
[ ] Checklist section 12 du CLAUDE.md complètement validée
[ ] Context Snapshot final mis à jour
```

---

## 🐛 Prompts de débogage — Quand utiliser quoi

| Symptôme                             | Prompt à copier                                    |
| ------------------------------------ | -------------------------------------------------- |
| Compteur saccade / lag               | "Si le compteur saccade" dans PROMPT_CLAUDECODE.md |
| Meeting counter → 0 après background | "Si le Meeting counter ne reprend pas"             |
| Comparateur lag avec 3 profils       | "Si le comparateur de salaires lag"                |
| Snapshot tout blanc                  | "Si expo-view-shot capture une vue blanche"        |
| isPremium reste false après achat    | "Si RevenueCat ne détecte pas le statut premium"   |
| Salaire perdu au redémarrage         | "Si le salaire est perdu après fermeture"          |

> **Règle de débogage** : toujours ajouter la cause + le fix dans le registre
> **ERREURS CONNUES** de `CLAUDE.md` après résolution.

---

## ♻️ Reprendre une session interrompue

Si Claude Code redémarre ou si tu fermes et rouvres, colle ce prompt :

```
Reprends le projet WealthClock.

1. Lis le Context Snapshot en haut du CLAUDE.md
2. Lis le registre ERREURS CONNUES
3. Confirme l'étape actuelle et ce qui reste à faire
4. Continue à partir du dernier point d'arrêt

Ne recommence pas depuis le début. Continue où on en était.
```

---

## 📊 Tableau de progression

Coche les étapes au fur et à mesure :

| Étape | Nom                        | Statut |
| ----- | -------------------------- | ------ |
| 1     | Setup projet               | ⬜     |
| 2     | Navigation Expo Router     | ⬜     |
| 3     | Logique pure + Tests       | ⬜     |
| 4     | Value Converter            | ⬜     |
| 5     | Salary Profiles            | ⬜     |
| 6     | Zustand Store              | ⬜     |
| 7     | SecureStorage + Onboarding | ⬜     |
| 8     | Compteur principal ⚠️      | ⬜     |
| 9     | Écran Home + FeatureCards  | ⬜     |
| 10    | Comparateur de Valeur      | ⬜     |
| 11    | Mode Meeting ⚠️            | ⬜     |
| 11b   | Life Cost Scanner          | ⬜     |
| 12    | Comparateur de Salaires ⚠️ | ⬜     |
| 13    | Temps Libre en Négatif     | ⬜     |
| 14    | Wealth Snapshot ⚠️         | ⬜     |
| 15    | ShareButton global         | ⬜     |
| 16    | RevenueCat + Paywall       | ⬜     |
| 17    | Finitions + EAS Build      | ⬜     |

> ⚠️ = étapes avec pièges connus (voir prompts de débogage)

---

## 💡 Bonnes pratiques pendant le développement

1. **Une étape = une session Claude Code** idéalement
2. **Valide les critères** avant de passer à l'étape suivante — pas de raccourcis
3. **Le Context Snapshot** doit être à jour à la fin de chaque session
4. **Si tu es bloqué plus de 10min** → utilise le prompt de débogage approprié
5. **Commit à la fin de chaque étape validée** : un commit = une étape propre
6. **Ne touche jamais un fichier qui fonctionne** sans raison valable (anti-régression)
