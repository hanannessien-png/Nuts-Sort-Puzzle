/**
 * AdMob's published test application and ad-unit identifiers.
 *
 * These are deliberately the Google test identifiers, not production
 * inventory.  A release build must replace them with real IDs in native
 * configuration and in this module before ads can generate revenue.
 */
export const ADMOB_TEST_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
} as const;

export const ADMOB_TEST_AD_UNIT_IDS = {
  banner: {
    android: 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
  },
  interstitial: {
    android: 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
  },
  rewarded: {
    android: 'ca-app-pub-3940256099942544/5224354917',
    ios: 'ca-app-pub-3940256099942544/1712485313',
  },
  appOpen: {
    android: 'ca-app-pub-3940256099942544/9257395921',
    ios: 'ca-app-pub-3940256099942544/5662855259',
  },
} as const;

export type AdPlatform = keyof typeof ADMOB_TEST_APP_IDS;
export type AdFormat = keyof typeof ADMOB_TEST_AD_UNIT_IDS;

// Production inventory will be supplied by the owner. Keep Google test units
// in every slot until then; no guessed publisher IDs or environment fallbacks.
export const ADMOB_AD_UNIT_IDS: Record<AdFormat, Record<AdPlatform, string>> = {
  banner: { ...ADMOB_TEST_AD_UNIT_IDS.banner },
  interstitial: { ...ADMOB_TEST_AD_UNIT_IDS.interstitial },
  rewarded: { ...ADMOB_TEST_AD_UNIT_IDS.rewarded },
  appOpen: { ...ADMOB_TEST_AD_UNIT_IDS.appOpen },
};

export function getAdUnitId(format: AdFormat, platform: AdPlatform): string {
  return (__DEV__ ? ADMOB_TEST_AD_UNIT_IDS : ADMOB_AD_UNIT_IDS)[format][platform];
}

export function getTestAdUnitId(
  format: AdFormat,
  platform: AdPlatform,
): string {
  return ADMOB_TEST_AD_UNIT_IDS[format][platform];
}

/**
 * Ad-only tokens.  Keeping these local avoids changing the shared game
 * palette while giving the small footer a quiet, warm appearance.
 */
export const ADS_COLORS = {
  surface: '#FFFDF8',
  border: '#E8E2D8',
  text: '#6F675D',
  icon: '#8A8176',
} as const;