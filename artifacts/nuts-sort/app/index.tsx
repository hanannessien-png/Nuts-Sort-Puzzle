import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '@/game/GameProvider';
import { useThemeColors, useNutPalette } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo/vector-icons';
import { AdBanner } from '@/components/AdBanner';
import { LifeRefillModal } from '@/components/LifeRefillModal';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { CoinIcon } from '@/components/Icons';
import { Nut } from '@/components/Nut';

import { TactileButton } from '@/components/home/TactileButton';
import { TactileCard } from '@/components/home/TactileCard';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const theme = useThemeColors();
  const nutPalette = useNutPalette();

  const { state, startLevel } = game;
  const [showDaily, setShowDaily] = React.useState(false);
  const [showLifeRefill, setShowLifeRefill] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (game.setPlaying) {
        game.setPlaying(false);
      }
    }, [game.setPlaying])
  );

  const handlePlay = async () => {
    if (state.active) {
      router.push('/play');
      return;
    }
    if (state.lives <= 0) {
      setShowLifeRefill(true);
      return;
    }
    const res = await startLevel(state.unlockedLevel);
    if (res.ok) {
      router.push('/play');
    } else if (res.message?.toLowerCase().includes('lives')) {
      setShowLifeRefill(true);
    }
  };

  const totalItems = game.catalog ? game.catalog.length : 12;
  const totalStars = Object.values(state.records).reduce((sum, r) => sum + r.stars, 0);
  const boardsCompleted = Object.keys(state.records).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Background Texture/Gradient */}
      <LinearGradient 
        colors={[`${theme.surface}00`, `${theme.surface}60`, `${theme.background}`]} 
        style={StyleSheet.absoluteFill} 
        pointerEvents="none"
      />

      {/* Top HUD */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TactileCard 
          variant="inset" 
          color={theme.surface} 
          padding={0}
          style={styles.settingsBtnWrapper}
        >
          <Pressable style={styles.settingsBtnInner} onPress={() => router.push('/settings')}>
            <Ionicons name="settings-sharp" size={24} color={theme.textMuted} />
          </Pressable>
        </TactileCard>

        <TactileCard variant="inset" color={theme.surface} padding={0} style={styles.hudWrapper}>
          <View style={styles.hudInner}>
            <Pressable 
              onPress={() => setShowLifeRefill(true)} 
              style={({ pressed }) => [styles.hudItem, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name="heart" size={22} color={theme.danger} />
              <Text style={[styles.hudText, { color: theme.text }]}>{state.lives}</Text>
            </Pressable>
            <View style={[styles.hudDivider, { backgroundColor: theme.border }]} />
            <View style={styles.hudItem}>
              <CoinIcon size={22} />
              <Text style={[styles.hudText, { color: theme.text }]}>{state.coins}</Text>
            </View>
          </View>
        </TactileCard>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Main Hero Card */}
        <TactileCard color={theme.surface} padding={0} style={styles.heroCard}>
          <View style={styles.heroImageContainer}>
            <Image 
              source={require('@/assets/images/premium-hero.png')} 
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            {/* Gradient overlay to make text pop while keeping image vivid */}
            <LinearGradient 
              colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.2)']} 
              style={StyleSheet.absoluteFill} 
            />
            
            <View style={styles.heroHeader}>
              <Text style={styles.heroGameTitle}>NUTS SORT</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>LEVEL {state.unlockedLevel}</Text>
              </View>
            </View>

            {/* Nut Scene using actual components */}
            <View style={styles.heroScene}>
              <View style={styles.pegBase} />
              <View style={styles.pegStick} />
              <View style={styles.nutStack}>
                <Nut color={nutPalette[0] || '#C43D35'} size={70} />
                <Nut color={nutPalette[1] || '#3B6BC4'} size={70} />
                <Nut color={nutPalette[2] || '#418A53'} size={70} />
              </View>
            </View>
          </View>

          <View style={styles.heroFooter}>
            <Text style={[styles.heroSubtitle, { color: theme.textMuted }]}>
              {state.active ? 'RESUME YOUR PUZZLE' : 'START NEXT CHALLENGE'}
            </Text>
            <TactileButton 
              title={state.active ? 'CONTINUE' : 'PLAY NOW'} 
              onPress={handlePlay} 
              color={theme.primary} 
              shadowColor={theme.primaryMuted}
              icon="play"
            />
          </View>
        </TactileCard>

        {/* Live Progression Row */}
        <View style={styles.statsRow}>
          <TactileCard variant="inset" color={theme.surface} padding={16} style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Ionicons name="star" size={24} color={theme.warning} style={styles.statIcon} />
              <View>
                <Text style={[styles.statValue, { color: theme.text }]}>{totalStars}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Stars</Text>
              </View>
            </View>
          </TactileCard>
          <TactileCard variant="inset" color={theme.surface} padding={16} style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Ionicons name="checkmark-circle" size={24} color={theme.success} style={styles.statIcon} />
              <View>
                <Text style={[styles.statValue, { color: theme.text }]}>{boardsCompleted}</Text>
                <Text style={[styles.statLabel, { color: theme.textMuted }]}>Boards</Text>
              </View>
            </View>
          </TactileCard>
        </View>

        {/* Dashboard Grid */}
        <View style={styles.grid}>
          {/* Daily Streak */}
          <TactileCard 
            color={theme.surface} 
            padding={16} 
            style={styles.gridCard} 
            onPress={() => setShowDaily(true)}
          >
            <View style={styles.gridCardHeader}>
              <View style={[styles.iconBox, { backgroundColor: `${theme.warning}20` }]}>
                <Ionicons name="flame" size={22} color={theme.warning} />
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.border} />
            </View>
            <Text style={[styles.gridTitle, { color: theme.text }]}>Daily Streak</Text>
            <Text style={[styles.gridValue, { color: theme.warning }]}>{state.daily.streak} Days</Text>
          </TactileCard>

          {/* Collection */}
          <TactileCard 
            color={theme.surface} 
            padding={16} 
            style={styles.gridCard} 
            onPress={() => router.push('/shop')}
          >
            <View style={styles.gridCardHeader}>
              <View style={[styles.iconBox, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="color-palette" size={22} color={theme.primary} />
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.border} />
            </View>
            <Text style={[styles.gridTitle, { color: theme.text }]}>Collection</Text>
            <Text style={[styles.gridValue, { color: theme.primary }]}>{state.owned.length} / {totalItems}</Text>
          </TactileCard>
        </View>

        {/* Journey Row */}
        <TactileCard 
          color={theme.surface} 
          padding={16} 
          style={styles.journeyCardWrapper} 
          onPress={() => router.push('/levels')}
        >
          <View style={styles.journeyCard}>
            <View style={[styles.iconBox, { backgroundColor: `${theme.success}20`, marginRight: 16 }]}>
              <Ionicons name="map" size={24} color={theme.success} />
            </View>
            <View style={styles.journeyTextContainer}>
              <Text style={[styles.journeyTitle, { color: theme.text }]}>Journey Map</Text>
              <Text style={[styles.journeySubtitle, { color: theme.textMuted }]}>
                Explore your progress
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.border} />
          </View>
        </TactileCard>

      </ScrollView>

      {/* Footer Ad */}
      <View style={{ paddingBottom: Math.max(insets.bottom, 0) }}>
        <AdBanner />
      </View>

      {/* Daily Modal */}
      <Modal visible={showDaily} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <Pressable onPress={() => setShowDaily(false)} style={styles.modalClose}>
              <Ionicons name="close" size={28} color={theme.textMuted} />
            </Pressable>
            
            <Ionicons name="calendar" size={60} color={theme.warning} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Daily Check-In</Text>
            
            <View style={[styles.streakBadge, { backgroundColor: theme.warning + '20' }]}>
              <Ionicons name="flame" size={24} color={theme.warning} />
              <Text style={{ color: theme.warning, fontWeight: '900', fontSize: 22, marginLeft: 8 }}>
                {state.daily.streak} Day Streak
              </Text>
            </View>
            
            <View style={styles.rulesContainer}>
              <Text style={[styles.ruleText, { color: theme.textMuted }]}>
                Return daily to earn coins for power-ups and premium themes.
              </Text>
              
              <View style={styles.milestoneRow}>
                <Text style={[styles.milestoneLabel, { color: theme.text }]}>Daily:</Text>
                <Text style={[styles.milestoneReward, { color: theme.warning }]}>+10 coins</Text>
              </View>
              <View style={styles.milestoneRow}>
                <Text style={[styles.milestoneLabel, { color: theme.text }]}>Weekly (Day 7):</Text>
                <Text style={[styles.milestoneReward, { color: theme.warning }]}>+50 coins</Text>
              </View>
              <View style={styles.milestoneRow}>
                <Text style={[styles.milestoneLabel, { color: theme.text }]}>Monthly (Day 30):</Text>
                <Text style={[styles.milestoneReward, { color: theme.warning }]}>+100 coins</Text>
              </View>
            </View>
            
            <TactileButton 
              title="COLLECT REWARD" 
              onPress={() => setShowDaily(false)} 
              color={theme.primary} 
              shadowColor={theme.primaryMuted}
            />
          </View>
        </View>
      </Modal>

      <LifeRefillModal visible={showLifeRefill} onClose={() => setShowLifeRefill(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  settingsBtnWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  settingsBtnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudWrapper: {
    height: 48,
    borderRadius: 24,
  },
  hudInner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 16,
  },
  hudItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudText: {
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    lineHeight: 22, // Prevents clipping
  },
  hudDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 4,
  },
  heroCard: {
    marginBottom: 20,
  },
  heroImageContainer: {
    height: 220,
    position: 'relative',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heroHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  heroGameTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroBadgeText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
  heroScene: {
    position: 'absolute',
    bottom: -15,
    right: 30,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 150,
    width: 80,
    zIndex: 1,
  },
  pegBase: {
    position: 'absolute',
    bottom: 30,
    width: 60,
    height: 12,
    backgroundColor: '#333',
    borderRadius: 6,
    borderTopWidth: 2,
    borderColor: '#666',
  },
  pegStick: {
    position: 'absolute',
    bottom: 30,
    width: 14,
    height: 110,
    backgroundColor: '#555',
    borderRadius: 7,
    borderRightWidth: 3,
    borderColor: '#777',
  },
  nutStack: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 35, // Rest right on the pegBase
  },
  heroFooter: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
  },
  statCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  journeyCardWrapper: {
    marginBottom: 20,
  },
  journeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyTextContainer: {
    flex: 1,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  journeySubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
  },
  modalClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  streakBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 24,
  },
  rulesContainer: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  ruleText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  milestoneLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  milestoneReward: {
    fontSize: 16,
    fontWeight: '900',
  },
});
