import React, { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  adAvailability,
  getBannerAdComponent,
  getBannerAdSize,
  getBannerAdUnitId,
  subscribeAdState,
} from '@/services/ads';
import { ADS_COLORS } from '@/constants/ads';

type Availability = ReturnType<typeof adAvailability>;

function UnavailableFooter({ message }: { message: string }) {
  return (
    <View
      accessibilityLabel={message}
      style={styles.unavailable}
      testID="ad-banner-unavailable"
    >
      <Ionicons
        accessibilityLabel="Ad information"
        color={ADS_COLORS.icon}
        name="information-circle-outline"
        size={15}
      />
      <Text style={styles.unavailableText}>{message}</Text>
    </View>
  );
}

/**
 * A self-contained anchored adaptive banner.  It renders only a real native
 * BannerAd; web, Expo Go, consent failures, and request failures show a
 * compact neutral footer instead of fake creative.
 */
export function AdBanner() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingBottom: insets.bottom, backgroundColor: ADS_COLORS.surface }}>
      <BannerPlacement />
    </View>
  );
}

function BannerPlacement() {
  const [availability, setAvailability] = useState<Availability>(() =>
    adAvailability(),
  );
  const [bannerError, setBannerError] = useState<string | null>(null);

  useEffect(() => {
    const updateAvailability = () => {
      setAvailability(adAvailability());
    };
    updateAvailability();
    const unsubscribe = subscribeAdState(updateAvailability);
    const foreground = AppState.addEventListener('change', state => {
      if (state === 'active') {
        updateAvailability();
        setBannerError(null);
      }
    });
    return () => { unsubscribe(); foreground.remove(); };
  }, []);

  useEffect(() => {
    if (!bannerError || !availability.available) return;
    // No-fill/offline should not permanently remove the placement. Retry only
    // at a conservative interval, and cancel when the screen unmounts.
    const timer = setTimeout(() => setBannerError(null), 60_000);
    return () => clearTimeout(timer);
  }, [bannerError, availability.available]);

  const unavailableMessage =
    Platform.OS === 'web'
      ? 'Ads unavailable in preview'
      : bannerError ?? availability.message;

  if (!availability.available || bannerError) {
    return <UnavailableFooter message={unavailableMessage} />;
  }

  const BannerAd = getBannerAdComponent() as
    | React.ComponentType<{
        unitId: string;
        size: unknown;
        requestOptions?: { requestNonPersonalizedAdsOnly?: boolean };
        onAdLoaded?: () => void;
        onAdFailedToLoad?: (error: unknown) => void;
      }>
    | null;
  const bannerSize = getBannerAdSize();

  if (!BannerAd || !bannerSize) {
    return (
      <UnavailableFooter message="Ads are unavailable in this native build." />
    );
  }

  return (
    <View style={styles.container} testID="ad-banner">
      <BannerAd
        onAdFailedToLoad={() =>
          setBannerError('Ads are unavailable right now.')
        }
        onAdLoaded={() => setBannerError(null)}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        size={bannerSize}
        unitId={getBannerAdUnitId()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: ADS_COLORS.surface,
    borderTopColor: ADS_COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 50,
    overflow: 'hidden',
    width: '100%',
  },
  unavailable: {
    alignItems: 'center',
    backgroundColor: ADS_COLORS.surface,
    borderTopColor: ADS_COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: 12,
    width: '100%',
  },
  unavailableText: {
    color: ADS_COLORS.text,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default AdBanner;