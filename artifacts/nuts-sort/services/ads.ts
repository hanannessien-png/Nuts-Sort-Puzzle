import Constants from 'expo-constants';
import {
  NativeModules,
  Platform,
  TurboModuleRegistry,
} from 'react-native';
import {
  ADMOB_TEST_AD_UNIT_IDS,
  type AdFormat,
  type AdPlatform,
  getTestAdUnitId,
} from '@/constants/ads';

/**
 * This file intentionally does not import react-native-google-mobile-ads at
 * module evaluation time.  The package is native-only; importing it while
 * running in Expo Go or on web can crash before the app gets a chance to
 * render its unavailable state.
 */

type Unsubscribe = () => void;
type AdListener = (...args: unknown[]) => void;

type AdInstance = {
  addAdEventListener?: (
    event: unknown,
    listener: AdListener,
  ) => Unsubscribe;
  load: () => void | Promise<void>;
  show: () => void | Promise<void>;
};

type AdConstructor = {
  createForAdUnitId: (unitId: string) => AdInstance;
};

type AdsSdkModule = {
  AdEventType?: {
    CLOSED?: unknown;
    ERROR?: unknown;
    LOADED?: unknown;
  };
  AppOpenAd?: AdConstructor;
  BannerAd?: unknown;
  BannerAdSize?: {
    ANCHORED_ADAPTIVE_BANNER?: unknown;
  };
  AdsConsent?: {
    requestInfoUpdate: () => Promise<{
      canRequestAds?: boolean;
      isConsentFormAvailable?: boolean;
      status?: unknown;
    }>;
    loadAndShowConsentFormIfRequired: () => Promise<unknown>;
  };
  InterstitialAd?: AdConstructor;
  RewardedAd?: AdConstructor;
  RewardedAdEventType?: {
    EARNED_REWARD?: unknown;
    LOADED?: unknown;
  };
  mobileAds?: () => {
    initialize: () => Promise<unknown>;
  };
};

type NativeModuleCheck = {
  available: boolean;
  message?: string;
};

type ConsentState = 'unknown' | 'pending' | 'ready' | 'unavailable';

const INITIALIZATION_MESSAGE = 'Ads have not been initialized yet.';
const STORE_CLIENT_MESSAGE =
  'Ads are unavailable in Expo Go preview. Use a native development build.';
const WEB_MESSAGE = 'Ads unavailable in preview';
const NATIVE_MODULE_MESSAGE =
  'AdMob is unavailable in this native build. Install the AdMob config plugin and rebuild.';

let sdkModule: AdsSdkModule | null = null;
let sdkLoadMessage: string | null = null;
let consentState: ConsentState = 'unknown';
let initialized = false;
let initializationPromise: Promise<void> | undefined;
let adShowing = false;

function nativeEnvironmentCheck(): NativeModuleCheck {
  if (Platform.OS === 'web') {
    return { available: false, message: WEB_MESSAGE };
  }

  // `storeClient` is Expo Go.  Do this before looking up the native module:
  // Expo Go must never attempt to evaluate the native AdMob package.
  if (String(Constants.executionEnvironment) === 'storeClient') {
    return { available: false, message: STORE_CLIENT_MESSAGE };
  }

  try {
    const modules = NativeModules as Record<string, unknown>;
    const nativeModule = modules.RNGoogleMobileAdsModule;
    const turboRegistry = TurboModuleRegistry as unknown as {
      get?: (name: string) => unknown;
    };
    const turboModule = turboRegistry.get?.('RNGoogleMobileAdsModule');

    if (nativeModule || turboModule) {
      return { available: true };
    }
  } catch {
    // A missing TurboModule is a normal state for Expo Go and unconfigured
    // native builds.  Keep the failure as an unavailable status instead of
    // allowing a native lookup to crash the app.
  }

  return { available: false, message: NATIVE_MODULE_MESSAGE };
}

function loadSdkModule(): AdsSdkModule | null {
  if (sdkModule) {
    return sdkModule;
  }

  const nativeCheck = nativeEnvironmentCheck();
  if (!nativeCheck.available) {
    return null;
  }

  try {
    // Metro's require is intentionally deferred until after all native guards.
    // @ts-ignore The package is installed by the native app build.
    const loaded = require('react-native-google-mobile-ads') as AdsSdkModule;
    if (!loaded || typeof loaded !== 'object') {
      throw new Error('The AdMob JavaScript module did not load.');
    }
    sdkModule = loaded;
    sdkLoadMessage = null;
    return sdkModule;
  } catch {
    sdkLoadMessage = 'The AdMob SDK package is unavailable in this build.';
    return null;
  }
}

function platformForAdMob(): AdPlatform {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

function unitId(format: AdFormat): string {
  return getTestAdUnitId(format, platformForAdMob());
}

function unavailableMessage(): string {
  const nativeCheck = nativeEnvironmentCheck();
  if (!nativeCheck.available) {
    return nativeCheck.message ?? NATIVE_MODULE_MESSAGE;
  }
  if (sdkLoadMessage) {
    return sdkLoadMessage;
  }
  if (consentState === 'unavailable') {
    return 'Ads are unavailable because consent could not be initialized.';
  }
  if (consentState === 'pending') {
    return 'Ads are preparing consent.';
  }
  if (!initialized || consentState !== 'ready') {
    return INITIALIZATION_MESSAGE;
  }
  return 'Ads are unavailable right now.';
}

function releaseAdLock(): void {
  adShowing = false;
}

function acquireAdLock(): boolean {
  if (adShowing) {
    return false;
  }
  adShowing = true;
  return true;
}

function addListener(
  ad: AdInstance,
  event: unknown,
  listener: AdListener,
): Unsubscribe {
  if (event === undefined || typeof ad.addAdEventListener !== 'function') {
    throw new Error('The AdMob SDK did not provide the requested ad event.');
  }
  const remove = ad.addAdEventListener(event, listener);
  return typeof remove === 'function' ? remove : () => undefined;
}

/**
 * Initialize UMP consent first, then initialize the Google Mobile Ads SDK.
 * `canRequestAds` is checked after the consent form as well; the adapter
 * never silently bypasses UMP when the SDK does not expose consent support.
 */
async function initializeConsent(sdk: AdsSdkModule): Promise<void> {
  const consent = sdk.AdsConsent;
  if (
    !consent ||
    typeof consent.requestInfoUpdate !== 'function' ||
    typeof consent.loadAndShowConsentFormIfRequired !== 'function'
  ) {
    throw new Error(
      'AdMob UMP consent is unavailable in this native build; ads remain disabled.',
    );
  }

  const initialInfo = await consent.requestInfoUpdate();
  if (initialInfo.isConsentFormAvailable) {
    await consent.loadAndShowConsentFormIfRequired();
  }

  // A second request reads the post-form state.  Requiring the explicit
  // boolean is intentional: an SDK that cannot tell us whether ads may be
  // requested is not treated as consented.
  const finalInfo = await consent.requestInfoUpdate();
  if (finalInfo.canRequestAds !== true) {
    throw new Error(
      'AdMob consent was not granted or is still pending; ads remain disabled.',
    );
  }
}

/**
 * Synchronously reports whether a native, consented adapter is ready.
 * The main game can use this to gate only ad-dependent actions.
 */
export function adAvailability(): { available: boolean; message: string } {
  const nativeCheck = nativeEnvironmentCheck();
  if (!nativeCheck.available) {
    return {
      available: false,
      message: nativeCheck.message ?? NATIVE_MODULE_MESSAGE,
    };
  }

  if (!loadSdkModule()) {
    return {
      available: false,
      message: sdkLoadMessage ?? 'The AdMob SDK package is unavailable in this build.',
    };
  }

  if (!initialized || consentState !== 'ready') {
    return { available: false, message: unavailableMessage() };
  }

  return { available: true, message: 'Ads are available.' };
}

/**
 * Main calls this during hydration.  It rejects when a native module or UMP
 * consent is unavailable so callers can surface an explicit diagnostic.
 */
export function initializeAds(): Promise<void> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const nativeCheck = nativeEnvironmentCheck();
    if (!nativeCheck.available) {
      throw new Error(nativeCheck.message ?? NATIVE_MODULE_MESSAGE);
    }

    const sdk = loadSdkModule();
    if (!sdk) {
      throw new Error(sdkLoadMessage ?? 'The AdMob SDK package is unavailable in this build.');
    }
    if (typeof sdk.mobileAds !== 'function') {
      throw new Error('The AdMob SDK does not expose mobileAds initialization.');
    }

    initialized = false;
    consentState = 'pending';
    try {
      await initializeConsent(sdk);
      const ads = sdk.mobileAds();
      if (!ads || typeof ads.initialize !== 'function') {
        throw new Error('The AdMob SDK does not expose initialize().');
      }
      await ads.initialize();
      consentState = 'ready';
      initialized = true;
    } catch (error) {
      consentState = 'unavailable';
      initialized = false;
      throw error;
    }
  })();

  initializationPromise.catch(() => {
    initializationPromise = undefined;
  });

  return initializationPromise;
}

export function isAdShowing(): boolean {
  return adShowing;
}

/**
 * Show a rewarded ad and resolve true only after both native reward and close
 * events.  A close without EARNED_REWARD, an error, no-fill, or a timeout is
 * always a non-earned result.
 */
export function showRewardedAd(): Promise<{ earned: boolean; message?: string }> {
  const availability = adAvailability();
  if (!availability.available) {
    return Promise.resolve({ earned: false, message: availability.message });
  }
  if (!acquireAdLock()) {
    return Promise.resolve({
      earned: false,
      message: 'Another ad is already showing.',
    });
  }

  const sdk = sdkModule;
  const constructor = sdk?.RewardedAd;
  const events = sdk?.AdEventType;
  const rewardedEvents = sdk?.RewardedAdEventType;
  if (!constructor || !events || !rewardedEvents) {
    releaseAdLock();
    return Promise.resolve({
      earned: false,
      message: 'Rewarded ads are unavailable in this build.',
    });
  }

  return new Promise((resolve) => {
    let settled = false;
    let earned = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const unsubscribers: Unsubscribe[] = [];

    const finish = (result: {
      earned: boolean;
      message?: string;
    }): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      for (const unsubscribe of unsubscribers.splice(0)) {
        try {
          unsubscribe();
        } catch {
          // Listener cleanup must not prevent the single completion.
        }
      }
      releaseAdLock();
      resolve(result);
    };

    try {
      const ad = constructor.createForAdUnitId(unitId('rewarded'));
      unsubscribers.push(
        addListener(ad, rewardedEvents.LOADED, () => {
          if (settled) {
            return;
          }
          try {
            void Promise.resolve(ad.show()).catch(() => {
              finish({
                earned: false,
                message: 'The rewarded ad could not be shown.',
              });
            });
          } catch {
            finish({
              earned: false,
              message: 'The rewarded ad could not be shown.',
            });
          }
        }),
      );
      unsubscribers.push(
        addListener(ad, rewardedEvents.EARNED_REWARD, () => {
          if (!settled) {
            earned = true;
          }
        }),
      );
      unsubscribers.push(
        addListener(ad, events.CLOSED, () => {
          finish(
            earned
              ? { earned: true }
              : {
                  earned: false,
                  message: 'The rewarded ad was closed before completion.',
                },
          );
        }),
      );
      unsubscribers.push(
        addListener(ad, events.ERROR, () => {
          finish({
            earned: false,
            message: 'The rewarded ad is unavailable right now.',
          });
        }),
      );

      timeout = setTimeout(() => {
        finish({
          earned: false,
          message: 'The rewarded ad timed out before completion.',
        });
      }, 60_000);

      try {
        void Promise.resolve(ad.load()).catch(() => {
          finish({
            earned: false,
            message: 'The rewarded ad could not be loaded.',
          });
        });
      } catch {
        finish({
          earned: false,
          message: 'The rewarded ad could not be loaded.',
        });
      }
    } catch {
      finish({
        earned: false,
        message: 'Rewarded ads are unavailable right now.',
      });
    }
  });
}

/**
 * Interstitials and app-open ads are passive placements.  If a request fails,
 * they resolve without presenting anything so a safe game boundary never
 * becomes a gameplay error.  Availability remains observable via
 * adAvailability().
 */
function showPassiveAd(format: 'interstitial' | 'appOpen'): Promise<void> {
  const availability = adAvailability();
  if (!availability.available || !acquireAdLock()) {
    return Promise.resolve();
  }

  const sdk = sdkModule;
  const constructor =
    format === 'interstitial' ? sdk?.InterstitialAd : sdk?.AppOpenAd;
  const events = sdk?.AdEventType;
  if (!constructor || !events) {
    releaseAdLock();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const unsubscribers: Unsubscribe[] = [];

    const finish = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      for (const unsubscribe of unsubscribers.splice(0)) {
        try {
          unsubscribe();
        } catch {
          // Continue to the one completion even if a listener was removed.
        }
      }
      releaseAdLock();
      resolve();
    };

    try {
      const ad = constructor.createForAdUnitId(unitId(format));
      unsubscribers.push(
        addListener(ad, events.LOADED, () => {
          if (settled) {
            return;
          }
          try {
            void Promise.resolve(ad.show()).catch(finish);
          } catch {
            finish();
          }
        }),
      );
      unsubscribers.push(addListener(ad, events.CLOSED, finish));
      unsubscribers.push(addListener(ad, events.ERROR, finish));

      timeout = setTimeout(finish, 30_000);
      try {
        void Promise.resolve(ad.load()).catch(finish);
      } catch {
        finish();
      }
    } catch {
      finish();
    }
  });
}

export function showInterstitialAd(): Promise<void> {
  return showPassiveAd('interstitial');
}

export function showAppOpenAd(): Promise<void> {
  return showPassiveAd('appOpen');
}

/**
 * Internal bridge used by AdBanner after adAvailability() is true.  Keeping
 * the package lookup here preserves the same Expo Go/native-module guard.
 */
export function getBannerAdComponent(): unknown {
  return loadSdkModule()?.BannerAd ?? null;
}

export function getBannerAdSize(): unknown {
  return loadSdkModule()?.BannerAdSize?.ANCHORED_ADAPTIVE_BANNER ?? null;
}

export function getBannerAdUnitId(): string {
  return ADMOB_TEST_AD_UNIT_IDS.banner[platformForAdMob()];
}