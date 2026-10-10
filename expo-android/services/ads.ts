import Constants from 'expo-constants';
import { AppState, NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import { getAdUnitId, type AdFormat } from '@/constants/ads';

// Type-only: evaluating this native package in Expo Go or web crashes.
type AdsSdk = typeof import('react-native-google-mobile-ads');
type ConsentInfo = import('react-native-google-mobile-ads').AdsConsentInfo;
type Unsubscribe = () => void;
type AdInstance = {
  addAdEventListener: (event: never, callback: (...args: unknown[]) => void) => Unsubscribe;
  load: () => void;
  show: () => Promise<void>;
};
type AdResult = { earned: boolean; message?: string };

let sdk: AdsSdk | undefined;
let initialized = false;
let initialization: Promise<void> | undefined;
let consentInfo: ConsentInfo | undefined;
let showing = false;
// A timed-out native presentation cannot be forcibly dismissed from JS. Never
// stack another ad on top of it or resume gameplay until native close evidence.
let presentationUncertain = false;
let status = 'Ads have not been initialized yet.';
const listeners = new Set<() => void>();
const notify = () => { for (const listener of listeners) listener(); };
export function subscribeAdState(listener: () => void): Unsubscribe {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function nativeMessage(): string | null {
  if (Platform.OS === 'web') return 'Ads unavailable in browser preview.';
  if (String(Constants.executionEnvironment) === 'storeClient') {
    return 'Ads are unavailable in Expo Go preview. Use a native development build.';
  }
  try {
    if (NativeModules.RNGoogleMobileAdsModule || TurboModuleRegistry.get('RNGoogleMobileAdsModule')) return null;
  } catch { /* Missing native modules are an explicit unavailable state. */ }
  return 'AdMob is unavailable in this native build. Rebuild with the AdMob config plugin.';
}

function loadSdk(): AdsSdk {
  const message = nativeMessage();
  if (message) throw new Error(message);
  // Deliberately deferred behind native guards, never a top-level import.
  sdk ??= require('react-native-google-mobile-ads') as AdsSdk;
  return sdk;
}

function bounded<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(value => { clearTimeout(timer); resolve(value); },
      error => { clearTimeout(timer); reject(error); });
  });
}

function lock(): boolean {
  if (showing || presentationUncertain || AppState.currentState === 'background'
    || AppState.currentState === 'inactive') return false;
  showing = true;
  notify();
  return true;
}
function unlock() { showing = false; notify(); }
export function isAdShowing(): boolean { return showing; }

export function adAvailability(): { available: boolean; message: string } {
  const message = nativeMessage();
  if (message) return { available: false, message };
  if (presentationUncertain) return {
    available: false,
    message: showing
      ? 'Waiting for the ad or privacy form to close. If it is stuck, restart the app.'
      : 'An ad did not close normally. Restart the app to retry ads; you can keep playing.',
  };
  return { available: initialized && consentInfo?.canRequestAds === true, message: status };
}

export function privacyOptionsAvailability(): { required: boolean; available: boolean; message: string } {
  const required = consentInfo?.privacyOptionsRequirementStatus === 'REQUIRED';
  const message = nativeMessage();
  return {
    required,
    available: !message && required && !showing && !presentationUncertain,
    message: message ?? (required ? 'Manage your ad privacy choices.' : 'No ad privacy form is required for your region right now.'),
  };
}

async function nativeConsentForm(work: () => Promise<ConsentInfo>): Promise<ConsentInfo> {
  if (!lock()) throw new Error('Another ad or privacy form is already open.');
  let completed = false;
  let pending: Promise<ConsentInfo>;
  try { pending = work(); }
  catch (error) { unlock(); throw error; }
  // The JS deadline is not proof that the native form has disappeared.
  // Its actual completion/rejection is the evidence that permits unlocking.
  const completion = pending.finally(() => { completed = true; unlock(); });
  try {
    return await bounded(completion, 120_000,
      'The ad privacy form timed out. Restart the app to retry ads.');
  } catch (error) {
    if (!completed) { presentationUncertain = true; notify(); }
    throw error;
  }
}

export function initializeAds(): Promise<void> {
  if (initialization) return initialization;
  initialization = (async () => {
    try {
      const module = loadSdk();
      status = 'Preparing ad privacy choices.';
      notify();
      // One network update per session. Read cached post-form state rather than
      // making a second network request, which could fail after valid consent.
      consentInfo = await bounded(module.AdsConsent.requestInfoUpdate(), 10_000, 'Ad privacy information could not be loaded. Try again when online.');
      notify();
      if (consentInfo.isConsentFormAvailable) {
        consentInfo = await nativeConsentForm(() => module.AdsConsent.loadAndShowConsentFormIfRequired());
      }
      consentInfo = await bounded(module.AdsConsent.getConsentInfo(), 5_000, 'Ad privacy information is unavailable.');
      if (!consentInfo.canRequestAds) throw new Error('Ads are unavailable until the required privacy choices are completed.');
      // The installed SDK exports its factory as DEFAULT, not mobileAds.
      await bounded(module.default().initialize(), 10_000, 'Ad initialization timed out. You can keep playing.');
      initialized = true;
      status = 'Ads are available.';
      notify();
    } catch (error) {
      initialized = false;
      status = error instanceof Error ? error.message : 'Ads are unavailable right now.';
      notify();
      throw error;
    }
  })();
  initialization.catch(() => { initialization = undefined; });
  return initialization;
}

export async function showAdPrivacyOptions(): Promise<{ ok: boolean; message: string }> {
  const availability = privacyOptionsAvailability();
  if (!availability.available) return { ok: false, message: availability.message };
  try {
    const module = loadSdk();
    // Unmount banners while choices change, even if the form then fails.
    initialized = false;
    notify();
    consentInfo = await nativeConsentForm(() => module.AdsConsent.showPrivacyOptionsForm());
    consentInfo = await bounded(module.AdsConsent.getConsentInfo(), 5_000, 'Could not read your updated privacy choices.');
    if (consentInfo.canRequestAds) {
      await bounded(module.default().initialize(), 10_000, 'Ad initialization timed out.');
      initialized = true;
    }
    status = initialized ? 'Ads are available.' : 'Ads are disabled by your current privacy choices.';
    initialization = undefined;
    notify();
    return { ok: true, message: 'Your ad privacy choices have been updated.' };
  } catch (error) {
    status = error instanceof Error ? error.message : 'The ad privacy form could not be opened.';
    initialization = undefined;
    notify();
    return { ok: false, message: status };
  }
}

function unitId(format: AdFormat): string {
  return getAdUnitId(format, Platform.OS === 'ios' ? 'ios' : 'android');
}

/**
 * A load deadline is separate from the on-screen lifetime. A long video must
 * not lose its reward listener or release the presentation lock after 30/60s.
 * The watchdog bounds the caller's wait, but cannot dismiss native UI. After
 * it fires only close/error listeners remain, keeping input/time locked until
 * native closure evidence arrives. Background/foreground alone is not proof.
 */
function fullScreen(format: Exclude<AdFormat, 'banner'>, canShow: () => boolean): Promise<AdResult> {
  const availability = adAvailability();
  if (!availability.available) return Promise.resolve({ earned: false, message: availability.message });
  if (!canShow() || !lock()) return Promise.resolve({ earned: false, message: 'Another ad is open or this placement is no longer visible.' });
  return new Promise(resolve => {
    let settled = false;
    let finished = false;
    let earned = false;
    let presented = false;
    let markedUncertain = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const subscriptions: Unsubscribe[] = [];
    const closureSubscriptions: Unsubscribe[] = [];
    const cleanup = (removers: Unsubscribe[]) => {
      for (const unsubscribe of removers.splice(0)) {
        try { unsubscribe(); } catch { /* Complete remaining cleanup. */ }
      }
    };
    const finish = (message?: string) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      cleanup(subscriptions);
      cleanup(closureSubscriptions);
      // A late native CLOSED/ERROR is the closure evidence the watchdog was
      // waiting for, so ads become available again without an app restart.
      if (markedUncertain) presentationUncertain = false;
      unlock();
      if (!settled) {
        settled = true;
        resolve({ earned: earned && !message, message });
      }
    };
    try {
      const module = loadSdk();
      const constructor = format === 'rewarded' ? module.RewardedAd
        : format === 'interstitial' ? module.InterstitialAd : module.AppOpenAd;
      const ad = constructor.createForAdRequest(unitId(format)) as unknown as AdInstance;
      const on = (event: string, callback: () => void, closureEvidence = false) => {
        (closureEvidence ? closureSubscriptions : subscriptions)
          .push(ad.addAdEventListener(event as never, callback));
      };
      on(format === 'rewarded' ? module.RewardedAdEventType.LOADED : module.AdEventType.LOADED, () => {
        if (settled || presented) return;
        if (!canShow() || AppState.currentState === 'background' || AppState.currentState === 'inactive') {
          finish('The ad was skipped because the app is no longer at an ad boundary.');
          return;
        }
        presented = true;
        clearTimeout(timer);
        timer = setTimeout(() => {
          presentationUncertain = true;
          markedUncertain = true;
          settled = true;
          cleanup(subscriptions);
          notify();
          // Keep the presentation lock and the two closure-evidence listeners.
          // A late CLOSED/ERROR cleans them and unlocks, without a second result.
          resolve({ earned: false, message: 'The ad did not close normally. Close it or restart the app to continue.' });
        }, 180_000);
        try { void ad.show().catch(() => finish('The ad could not be shown.')); }
        catch { finish('The ad could not be shown.'); }
      });
      if (format === 'rewarded') {
        on(module.RewardedAdEventType.EARNED_REWARD, () => { if (presented && !settled) earned = true; });
      }
      on(module.AdEventType.CLOSED, () => finish(
        format === 'rewarded' && !earned ? 'The ad was closed before the reward was earned.' : undefined,
      ), true);
      on(module.AdEventType.ERROR, () => finish('No ad is available right now. Please try again later.'), true);
      timer = setTimeout(() => finish('The ad could not load in time. Please try again later.'), format === 'appOpen' ? 4_000 : 8_000);
      ad.load();
    } catch { finish('Ads are unavailable right now. Please try again later.'); }
  });
}

export function showRewardedAd(): Promise<AdResult> {
  return fullScreen('rewarded', () => true);
}
export async function showInterstitialAd(canShow: () => boolean = () => true): Promise<void> {
  await fullScreen('interstitial', canShow);
}
export async function showAppOpenAd(canShow: () => boolean = () => true): Promise<void> {
  await fullScreen('appOpen', canShow);
}
export function getBannerAdComponent(): unknown { return sdk?.BannerAd ?? null; }
export function getBannerAdSize(): unknown { return sdk?.BannerAdSize.ANCHORED_ADAPTIVE_BANNER ?? null; }
export function getBannerAdUnitId(): string { return unitId('banner'); }