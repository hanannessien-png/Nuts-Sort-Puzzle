import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { privacyOptionsAvailability, showAdPrivacyOptions, subscribeAdState } from '@/services/ads';

export function AdPrivacySettings() {
  const theme = useThemeColors();
  const [availability, setAvailability] = useState(privacyOptionsAvailability);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => subscribeAdState(() => setAvailability(privacyOptionsAvailability())), []);
  if (!availability.required) return null;
  return (
    <View style={{ marginTop: 16, padding: 18, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 18 }}>
      <Pressable testID="btn-ad-privacy" accessibilityRole="button" accessibilityLabel="Manage ad privacy"
        disabled={busy || !availability.available}
        onPress={async () => {
          setBusy(true);
          setMessage('');
          try {
            const result = await showAdPrivacyOptions();
            setMessage(result.message);
          } catch {
            setMessage('Ad privacy options could not be opened. Please try again.');
          } finally {
            setBusy(false);
            setAvailability(privacyOptionsAvailability());
          }
        }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, opacity: busy || !availability.available ? 0.55 : 1 }}>
        <Ionicons name="shield-checkmark-outline" size={24} color={theme.primary} />
        <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15, flex: 1 }}>{busy ? 'Opening privacy options…' : 'Ad privacy options'}</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </Pressable>
      <Text accessibilityLiveRegion="polite" style={{ color: theme.textMuted, lineHeight: 18, fontSize: 12, marginTop: 8 }}>
        {message || availability.message}
      </Text>
    </View>
  );
}