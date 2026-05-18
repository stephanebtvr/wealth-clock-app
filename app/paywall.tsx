import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { usePurchases } from '@/hooks/usePurchases'
import { PRODUCT_IDS } from '@/config/revenuecat'
import type { PurchasesPackage } from 'react-native-purchases'

// ─── Features list ────────────────────────────────────────────────────────────

const PREMIUM_FEATURES = [
  { emoji: '💰', label: 'Comparateur de valeur — ce produit = X minutes de ta vie' },
  { emoji: '👥', label: 'Mode Réunion — coût en temps réel de chaque meeting' },
  { emoji: '📊', label: 'Comparateur de salaires — toi vs SMIC vs Mbappé' },
  { emoji: '⏱️', label: 'Temps libre en négatif — valorise chaque moment perdu' },
  { emoji: '🧾', label: 'Scanner de reçus — convertis chaque achat en temps de travail' },
  { emoji: '📸', label: 'Wealth Snapshot — template viral TikTok / Instagram' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

type PlanId = 'monthly' | 'annual'

function getPkg(
  pkgId: string,
  packages: PurchasesPackage[] | undefined,
): PurchasesPackage | undefined {
  return packages?.find((p) => p.product.identifier === pkgId)
}

function priceFor(pkg: PurchasesPackage | undefined, fallback: string): string {
  return pkg?.product.priceString ?? fallback
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const router = useRouter()
  const { purchaseState, error, offerings, purchasePremium, restorePurchases } = usePurchases()
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual')

  const availablePackages = offerings?.current?.availablePackages
  const monthlyPkg = getPkg(PRODUCT_IDS.MONTHLY, availablePackages)
  const annualPkg = getPkg(PRODUCT_IDS.ANNUAL, availablePackages)

  const isLoading = purchaseState === 'loading'

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'annual' ? annualPkg : monthlyPkg
    if (!pkg) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await purchasePremium(pkg)
    if (purchaseState === 'success') router.back()
  }

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await restorePurchases()
    if (purchaseState === 'success') router.back()
  }

  const handleSelectPlan = (plan: PlanId) => {
    Haptics.selectionAsync()
    setSelectedPlan(plan)
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />

      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        {/* Handle */}
        <View style={styles.handleBar} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <Text style={styles.badge}>PREMIUM</Text>
          <Text style={styles.title}>Débloque tout WealthClock</Text>
          <Text style={styles.subtitle}>
            Vois en direct ce que chaque moment de ta vie vaut vraiment.
          </Text>

          {/* Features */}
          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f.label} style={styles.featureRow}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          {/* Plan selector */}
          <View style={styles.planRow}>
            {/* Monthly */}
            <Pressable
              style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
              onPress={() => handleSelectPlan('monthly')}
            >
              <Text style={styles.planName}>Mensuel</Text>
              <Text style={styles.planPrice}>
                {priceFor(monthlyPkg, '2,99 €')}/mois
              </Text>
            </Pressable>

            {/* Annual — highlighted */}
            <Pressable
              style={[styles.planCard, styles.planCardAnnual, selectedPlan === 'annual' && styles.planCardAnnualSelected]}
              onPress={() => handleSelectPlan('annual')}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>MEILLEURE OFFRE</Text>
              </View>
              <Text style={[styles.planName, styles.planNameAnnual]}>Annuel</Text>
              <Text style={[styles.planPrice, styles.planPriceAnnual]}>
                {priceFor(annualPkg, '19,99 €')}/an
              </Text>
              <Text style={styles.planSavings}>soit ~1,67 €/mois</Text>
            </Pressable>
          </View>

          {/* Status messages */}
          {purchaseState === 'cancelled' && (
            <Text style={styles.statusNeutral}>Achat annulé.</Text>
          )}
          {purchaseState === 'already_purchased' && (
            <Text style={styles.statusNeutral}>Aucun achat trouvé à restaurer.</Text>
          )}
          {purchaseState === 'error' && error && (
            <Text style={styles.statusError}>{error}</Text>
          )}

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
              isLoading && styles.ctaButtonDisabled,
            ]}
            onPress={handlePurchase}
            disabled={isLoading || (!monthlyPkg && !annualPkg)}
          >
            {isLoading ? (
              <ActivityIndicator color="#0A0A0F" />
            ) : (
              <Text style={styles.ctaText}>Déverrouiller Premium</Text>
            )}
          </Pressable>

          {/* Restore */}
          <Pressable
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isLoading}
          >
            <Text style={styles.restoreText}>Restaurer mes achats</Text>
          </Pressable>

          <Text style={styles.legal}>
            Paiement via l'App Store. Renouvelé automatiquement. Annulable à tout moment.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#13131A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1E1E2E',
    borderBottomWidth: 0,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#44445A',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },

  // Header
  badge: {
    fontFamily: 'Outfit-Bold',
    fontSize: 11,
    color: '#FFD700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'Outfit-Bold',
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: 'Outfit',
    fontSize: 14,
    color: '#8888AA',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Features
  featureList: {
    gap: 10,
    paddingVertical: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureEmoji: {
    fontSize: 18,
    lineHeight: 22,
    width: 24,
    textAlign: 'center',
  },
  featureLabel: {
    flex: 1,
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#CCCCDD',
    lineHeight: 19,
  },

  // Plans
  planRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1E1E2E',
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  planCardSelected: {
    borderColor: '#8888AA',
  },
  planCardAnnual: {
    backgroundColor: '#0D2010',
    borderColor: '#00FF8733',
    position: 'relative',
    paddingTop: 28,
  },
  planCardAnnualSelected: {
    borderColor: '#00FF87',
    backgroundColor: '#0F2A14',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    backgroundColor: '#00FF87',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingVertical: 3,
    alignItems: 'center',
  },
  bestValueText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 9,
    color: '#0A0A0F',
    letterSpacing: 1,
  },
  planName: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    color: '#8888AA',
  },
  planNameAnnual: {
    color: '#FFFFFF',
  },
  planPrice: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  planPriceAnnual: {
    color: '#00FF87',
    fontSize: 18,
  },
  planSavings: {
    fontFamily: 'Outfit',
    fontSize: 10,
    color: '#00FF87',
    opacity: 0.7,
    textAlign: 'center',
  },

  // Status
  statusNeutral: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#8888AA',
    textAlign: 'center',
  },
  statusError: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#FF4444',
    textAlign: 'center',
  },

  // CTA
  ctaButton: {
    backgroundColor: '#00FF87',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  ctaButtonPressed: {
    backgroundColor: '#00CC6A',
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 17,
    color: '#0A0A0F',
    letterSpacing: 0.3,
  },

  // Restore
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  restoreText: {
    fontFamily: 'Outfit',
    fontSize: 13,
    color: '#44445A',
    textDecorationLine: 'underline',
  },

  // Legal
  legal: {
    fontFamily: 'Outfit',
    fontSize: 11,
    color: '#44445A',
    textAlign: 'center',
    lineHeight: 16,
  },
})
