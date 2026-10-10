const MESSAGE = 'Ads are unavailable in the browser preview. Play normally; ad rewards require the native app.';

export function adAvailability(): { available: boolean; message: string } {
  return { available: false, message: MESSAGE };
}
export async function initializeAds(): Promise<void> {}
export function isAdShowing(): boolean { return false; }
export async function showRewardedAd(): Promise<{ earned: boolean; message?: string }> {
  return { earned: false, message: MESSAGE };
}
export async function showInterstitialAd(_canShow?: () => boolean): Promise<void> {}
export async function showAppOpenAd(_canShow?: () => boolean): Promise<void> {}
export function subscribeAdState(_listener: () => void): () => void { return () => undefined; }
export function privacyOptionsAvailability(): { required: boolean; available: boolean; message: string } {
  return { required: false, available: false, message: MESSAGE };
}
export async function showAdPrivacyOptions(): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: MESSAGE };
}
export function getBannerAdComponent(): unknown { return null; }
export function getBannerAdSize(): unknown { return null; }
export function getBannerAdUnitId(): string { return ''; }