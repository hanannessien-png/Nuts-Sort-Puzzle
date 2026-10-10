import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Test doubles only: no mocked ads are shipped in application code.
const compile = path => ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const source = compile('../services/ads.ts');
const constants = {};
vm.runInNewContext(compile('../constants/ads.ts'), { exports: constants, __DEV__: false });
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

// Exercise the actual provider's cold-open predicate without rendering UI.
const providerText = readFileSync(new URL('../game/GameProvider.tsx', import.meta.url), 'utf8');
const providerAst = ts.createSourceFile('GameProvider.tsx', providerText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let coldOpenPredicate;
const visit = node => {
  if (ts.isVariableDeclaration(node) && node.name.getText(providerAst) === 'canShowColdOpen') {
    coldOpenPredicate = node.initializer.getText(providerAst);
  }
  ts.forEachChild(node, visit);
};
visit(providerAst);
assert.ok(coldOpenPredicate);
let bootNow = 0;
const boot = {
  cancelled: false, startupPending: { current: true }, mono: () => bootNow, deadline: 4_000,
  visible: { current: false }, foreground: { current: true }, operation: { current: false },
  current: { current: { roundsPlayed: 0, interstitialDue: false } }, storageFault: { current: false },
};
const canShowColdOpen = vm.runInNewContext(`(${coldOpenPredicate})`, boot);
assert.equal(canShowColdOpen(), true, 'First launch has no completed-round minimum once consent/SDK are ready');
bootNow = 4_000;
assert.equal(canShowColdOpen(), false, 'Cold-open must never show after the 4s loading window');
bootNow = 0;
for (const [ref, value] of [
  [boot.startupPending, false], [boot.visible, true], [boot.foreground, false],
  [boot.operation, true], [boot.storageFault, true],
]) {
  const prior = ref.current;
  ref.current = value;
  assert.equal(canShowColdOpen(), false, 'Cold-open respects the safe loading boundary');
  ref.current = prior;
}
boot.current.current.interstitialDue = true;
assert.equal(canShowColdOpen(), false, 'A queued interstitial does not stack with cold-open');

function harness({ expoGo = false, offline = false, hungConsent = false, hungForm = false } = {}) {
  let now = 0, nextTimer = 0, imports = 0, initialized = 0, infoRequests = 0, forms = 0;
  let closeForm;
  const timers = new Map(), instances = [];
  const info = { canRequestAds: true, isConsentFormAvailable: true, privacyOptionsRequirementStatus: 'REQUIRED' };
  const appState = { currentState: 'active' };
  const sdk = {
    default: () => ({ initialize: async () => { initialized++; } }),
    AdsConsent: {
      requestInfoUpdate: async () => {
        infoRequests++;
        if (offline) throw new Error('offline');
        if (hungConsent) await new Promise(() => {});
        return { ...info };
      },
      getConsentInfo: async () => ({ ...info }),
      loadAndShowConsentFormIfRequired: async () => {
        forms++;
        if (hungForm) await new Promise(resolve => { closeForm = resolve; });
        return { ...info };
      },
      showPrivacyOptionsForm: async () => { info.canRequestAds = false; return { ...info }; },
    },
    AdEventType: { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error' },
    RewardedAdEventType: { LOADED: 'rewarded_loaded', EARNED_REWARD: 'earned' },
  };
  for (const format of ['RewardedAd', 'InterstitialAd', 'AppOpenAd']) {
    sdk[format] = {
      createForAdRequest(id) {
        const listeners = new Map();
        const ad = {
          id, shows: 0, loads: 0,
          addAdEventListener(event, listener) {
            listeners.set(event, listener);
            return () => listeners.delete(event);
          },
          load() { ad.loads++; },
          async show() { ad.shows++; },
          emit(event) { listeners.get(event)?.(); },
          listenerCount: () => listeners.size,
        };
        instances.push(ad);
        return ad;
      },
    };
  }
  const exports = {};
  vm.runInNewContext(source, {
    exports, console,
    setTimeout: (fn, delay) => { const id = ++nextTimer; timers.set(id, { at: now + delay, fn }); return id; },
    clearTimeout: id => timers.delete(id),
    require: id => {
      if (id === 'expo-constants') return { __esModule: true, default: { executionEnvironment: expoGo ? 'storeClient' : 'standalone' } };
      if (id === 'react-native') return { Platform: { OS: 'android' }, NativeModules: { RNGoogleMobileAdsModule: {} }, TurboModuleRegistry: { get: () => ({}) }, AppState: appState };
      if (id === '@/constants/ads') return constants;
      if (id === 'react-native-google-mobile-ads') { imports++; return sdk; }
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  return {
    api: exports, instances, appState,
    closeForm: () => closeForm?.(),
    counts: () => ({ imports, initialized, infoRequests, forms, timers: timers.size }),
    async advance(ms) {
      now += ms;
      for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn(); }
      await flush();
    },
  };
}

const h = harness();
await h.api.initializeAds();
assert.equal(h.api.adAvailability().available, true);
assert.equal(h.counts().initialized, 1, 'Installed SDK default initialization export is called');
assert.equal(h.counts().infoRequests, 1, 'Post-form consent reads cached state, not a second network update');
await h.api.initializeAds();
assert.equal(h.counts().initialized, 1, 'Initialization is idempotent');
let updates = 0;
const unsubscribe = h.api.subscribeAdState(() => updates++);

let result = h.api.showRewardedAd();
let ad = h.instances.at(-1);
assert.equal(ad.id, "ca-app-pub-6225158226956884/8690168870", "Production rewarded unit is used outside dev/test-forced builds");
ad.emit('rewarded_loaded');
assert.equal(ad.shows, 1);
assert.equal((await h.api.showRewardedAd()).earned, false, 'Concurrent presentations are rejected');
await h.advance(65_000);
assert.equal(h.api.isAdShowing(), true, 'A legitimate long video retains its listeners and lock');
ad.emit('earned');
ad.emit('closed');
assert.equal((await result).earned, true, 'Reward requires native earned event');
assert.equal(ad.listenerCount(), 0);
ad.emit('earned');
assert.equal(h.api.isAdShowing(), false);

result = h.api.showRewardedAd();
ad = h.instances.at(-1);
ad.emit('rewarded_loaded');
ad.emit('closed');
assert.equal((await result).earned, false, 'Closing early never grants rewards');
assert.equal(ad.listenerCount(), 0);

result = h.api.showRewardedAd();
ad = h.instances.at(-1);
await h.advance(8_001);
assert.equal((await result).earned, false);
ad.emit('rewarded_loaded');
assert.equal(ad.shows, 0, 'A timed-out load cannot display a late ad');
assert.equal(ad.listenerCount(), 0);

let boundary = true;
result = h.api.showAppOpenAd(() => boundary);
ad = h.instances.at(-1);
boundary = false;
ad.emit('loaded');
await result;
assert.equal(ad.shows, 0, 'Cold-open is skipped when loading boundary has passed');
assert.equal(ad.listenerCount(), 0);

result = h.api.showInterstitialAd();
ad = h.instances.at(-1);
h.appState.currentState = 'background';
ad.emit('loaded');
await result;
assert.equal(ad.shows, 0, 'Backgrounded app never displays a late ad');
h.appState.currentState = 'active';

result = h.api.showRewardedAd();
ad = h.instances.at(-1);
ad.emit('error');
assert.equal((await result).earned, false);
assert.equal(ad.listenerCount(), 0, 'No-fill cleans listeners and unlocks');

assert.equal(h.api.privacyOptionsAvailability().available, true);
assert.equal((await h.api.showAdPrivacyOptions()).ok, true);
assert.equal(h.api.adAvailability().available, false, 'Revoking consent disables banners and new requests');
assert.ok(updates > 0);
unsubscribe();
assert.equal(h.counts().timers, 0);

const go = harness({ expoGo: true });
await assert.rejects(go.api.initializeAds(), /Expo Go/);
assert.equal(go.counts().imports, 0, 'Expo Go must never evaluate native ads');
assert.equal((await go.api.showRewardedAd()).earned, false);
const offline = harness({ offline: true });
await assert.rejects(offline.api.initializeAds(), /offline/);
assert.equal(offline.api.isAdShowing(), false);
assert.equal(offline.api.adAvailability().available, false);
const hung = harness({ hungConsent: true });
const hungResult = hung.api.initializeAds();
const rejects = assert.rejects(hungResult, /online/);
await hung.advance(10_001);
await rejects;
assert.equal(hung.counts().forms, 0, 'Timed-out consent update never opens a late form');

const broken = harness();
await broken.api.initializeAds();
result = broken.api.showRewardedAd();
ad = broken.instances.at(-1);
ad.emit('rewarded_loaded');
await broken.advance(180_001);
assert.equal((await result).earned, false);
assert.equal(ad.listenerCount(), 2, 'Only native close/error evidence listeners survive a presentation watchdog');
assert.equal(broken.api.isAdShowing(), true, 'Watchdog does not resume gameplay/time under a native fullscreen');
assert.equal(broken.api.adAvailability().available, false, 'Uncertain native presentation cannot stack another ad');
broken.appState.currentState = 'background';
await broken.advance(1_000);
broken.appState.currentState = 'active';
assert.equal(broken.api.isAdShowing(), true, 'A background/foreground cycle alone does not prove native UI has closed');
ad.emit('earned');
assert.equal((await result).earned, false, 'Late native events cannot grant a second/uncertain result');
ad.emit('closed');
assert.equal(broken.api.isAdShowing(), false, 'Actual native close evidence safely resumes gameplay/time');
assert.equal(ad.listenerCount(), 0, 'Late native close removes the retained recovery listeners');
assert.equal(broken.counts().timers, 0);

for (const placement of ['showInterstitialAd', 'showAppOpenAd']) {
  const passive = harness();
  await passive.api.initializeAds();
  const pending = passive.api[placement]();
  const instance = passive.instances.at(-1);
  instance.emit('loaded');
  await passive.advance(180_001);
  await pending;
  assert.equal(passive.api.isAdShowing(), true, `${placement} retains its native presentation lock after watchdog`);
  instance.emit('error');
  assert.equal(passive.api.isAdShowing(), false, 'Native presentation failure is safe recovery evidence');
  assert.equal(instance.listenerCount(), 0);
}

const form = harness({ hungForm: true });
const formResult = form.api.initializeAds();
const formRejects = assert.rejects(formResult, /privacy form timed out/);
await flush();
await form.advance(120_001);
await formRejects;
assert.equal(form.api.isAdShowing(), true, 'A form watchdog cannot silently resume input/time under native consent UI');
form.closeForm();
await flush();
assert.equal(form.api.isAdShowing(), false, 'Actual native form completion safely releases its lock');
assert.equal(form.api.adAvailability().available, false, 'Timed-out privacy initialization does not silently enable ads later');

console.log('Ad regression checks passed: first-launch cold-open and safe loading boundaries, consent/privacy, earned-only rewards, no-fill/offline, preview isolation, deadlines, retained native presentation locks and safe closure cleanup.');