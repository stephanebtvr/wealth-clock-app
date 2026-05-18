export const REVENUECAT_IOS_KEY = process.env['EXPO_PUBLIC_REVENUECAT_IOS_KEY'] ?? ''
export const REVENUECAT_ANDROID_KEY = process.env['EXPO_PUBLIC_REVENUECAT_ANDROID_KEY'] ?? ''

export const ENTITLEMENT_PREMIUM = 'premium'

export const PRODUCT_IDS = {
  MONTHLY: 'wealthclock_premium_monthly',
  ANNUAL: 'wealthclock_premium_annual',
} as const
