const MESSAGE = 'Ads are unavailable in the browser preview. Play normally; ad rewards require the native app.';

export function adAvailability(): { available: boolean; message: string } {
  return { available: false, message: MESSAGE };
}
export async function initializeAds(): Promise<void> {}
export function isAdShowing(): boolean { return false; }
export async function showRewardedAd(): Promise<{ earned: boolean; message?: string }> {
  return { earned: false, message: MESSAGE };
}
export async function showInterstitialAd(): Promise<void> {}
export async function showAppOpenAd(): Promise<void> {}
export function getBannerAdComponent(): unknown { return null; }
export function getBannerAdSize(): unknown { return null; }
export function getBannerAdUnitId(): string { return ''; }