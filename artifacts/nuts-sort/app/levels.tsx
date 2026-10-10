import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '@/game/GameProvider';
import { LifeRefillModal } from '@/components/LifeRefillModal';
import { AdBanner } from '@/components/AdBanner';
import { Backdrop, WORLD_IMAGES } from '@/components/premium/Backdrop';
import { ScreenHeader, HudPill, Stars, GOLD, shade } from '@/components/premium/UI';

const PER_CHAPTER = 20;
const WORLDS = [
  { name: 'Copper Works', tag: 'Warm up the workshop', color: '#D9783A' },
  { name: 'Steel Foundry', tag: 'Cold metal, clear heads', color: '#3E8EC8' },
  { name: 'Jade Engine', tag: 'Every gear in its place', color: '#2FA36B' },
  { name: 'Royal Vault', tag: 'Only the sharpest sorters', color: '#9050D0' },
];
const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI'];

function world(index: number) {
  const w = WORLDS[index % WORLDS.length];
  const cycle = Math.floor(index / WORLDS.length);
  return { ...w, name: w.name + (ROMAN[cycle] ?? ` ${cycle + 1}`), image: WORLD_IMAGES[index % WORLD_IMAGES.length] };
}

export default function LevelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const game = useGame();
  const { state, startLevel } = game;
  const unlocked = state.unlockedLevel;
  const [showLifeRefill, setShowLifeRefill] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const scrollRef = React.useRef<ScrollView>(null);
  const scrolled = React.useRef(false);

  const currentChapter = Math.floor((unlocked - 1) / PER_CHAPTER);
  const chapters = Array.from({ length: currentChapter + 2 }, (_, i) => i);

  // Only an unfinished attempt is resumable. A won/lost board must start a
  // fresh run instead of reopening its old result screen.
  const unfinished = (id: number) => {
    const attempt = state.active?.levelId === id ? state.active : state.attempts[id];
    return attempt?.status === 'playing' || attempt?.status === 'timeout';
  };

  const handlePlayLevel = async (id: number) => {
    setMessage(null);
    if (state.active?.levelId === id && unfinished(id)) { router.push('/play'); return; }
    if (state.lives <= 0) { setShowLifeRefill(true); return; }
    const res = await startLevel(id);
    if (res.ok) router.push('/play');
    else if (res.message?.toLowerCase().includes('lives')) setShowLifeRefill(true);
    else if (res.message) setMessage(res.message);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <Backdrop image={(['w1', 'w2', 'w3', 'w4'] as const)[currentChapter % 4]} strength={0.7} />
      <ScreenHeader title="LEVELS" top={insets.top + (Platform.OS === 'web' ? 24 : 8)} onBack={() => router.back()}
        right={<HudPill icon={<Ionicons name="heart" size={20} color="#FF4D5E" />} value={state.lives} onPress={() => setShowLifeRefill(true)} />} />
      {message && <Text style={styles.message}>{message}</Text>}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {chapters.map(ci => {
          const w = world(ci);
          const first = ci * PER_CHAPTER + 1;
          const locked = first > unlocked;
          const ids = Array.from({ length: PER_CHAPTER }, (_, i) => first + i);
          const stars = ids.reduce((s, id) => s + (state.records[id]?.stars ?? 0), 0);
          const done = ids.filter(id => state.records[id]).length;
          return (
            <View key={ci} style={styles.chapter}
              onLayout={e => {
                if (ci === currentChapter && !scrolled.current) {
                  scrolled.current = true;
                  const y = e.nativeEvent.layout.y;
                  setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true }), 60);
                }
              }}>
              <View style={[styles.banner, { borderColor: shade(w.color, 0.35) }]}>
                <Image source={w.image} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['rgba(8,10,18,0.1)', 'rgba(8,10,18,0.85)']} style={StyleSheet.absoluteFill} />
                <View style={[styles.chapterNum, { backgroundColor: w.color }]}>
                  <Text style={styles.chapterNumText}>CHAPTER {ci + 1}</Text>
                </View>
                <View style={styles.bannerBottom}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.worldName}>{w.name}</Text>
                    <Text style={styles.worldTag}>{locked ? `Unlocks at level ${first}` : `Levels ${first}-${first + PER_CHAPTER - 1}  ·  ${w.tag}`}</Text>
                  </View>
                  {locked ? (
                    <View style={styles.lockBadge}><Ionicons name="lock-closed" size={22} color="#FFF" /></View>
                  ) : (
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={styles.starTotal}>
                        <Ionicons name="star" size={16} color={GOLD} />
                        <Text style={styles.starTotalText}>{stars}/{PER_CHAPTER * 5}</Text>
                      </View>
                      <Text style={styles.worldTag}>{done}/{PER_CHAPTER} cleared</Text>
                    </View>
                  )}
                </View>
                {!locked && (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${(stars / (PER_CHAPTER * 5)) * 100}%`, backgroundColor: GOLD }]} />
                  </View>
                )}
              </View>

              {!locked && (
                <View style={styles.grid}>
                  {ids.map(id => (
                    <LevelTile key={id} id={id} color={w.color} unlocked={unlocked}
                      stars={state.records[id]?.stars ?? 0} inProgress={unfinished(id)}
                      onPress={() => void handlePlayLevel(id)} />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <AdBanner />
      <LifeRefillModal visible={showLifeRefill} onClose={() => setShowLifeRefill(false)} />
    </View>
  );
}

function LevelTile({ id, color, unlocked, stars, inProgress, onPress }: { id: number; color: string; unlocked: number; stars: number; inProgress: boolean; onPress: () => void }) {
  const playable = id <= unlocked;
  const current = id === unlocked;
  const face = current ? GOLD : playable ? color : '#2A2F3D';
  return (
    <Pressable disabled={!playable} onPress={onPress} testID={`level-${id}`}
      accessibilityLabel={playable ? `Level ${id}${stars ? `, ${stars} of 5 stars` : ''}` : `Level ${id} locked`}
      style={({ pressed }) => [styles.tile, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
      <View style={[styles.tileLip, { backgroundColor: shade(face, -0.5) }]} />
      <LinearGradient colors={playable ? [shade(face, 0.3), face, shade(face, -0.25)] : ['#363C4C', '#252A37']}
        style={[styles.tileFace, current && { borderColor: '#FFF4CF', borderWidth: 2 }]}>
        {playable && <LinearGradient colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']} style={styles.tileSheen} />}
        {playable ? (
          <Text style={[styles.tileNum, current && { color: '#4A2C00', textShadowColor: 'rgba(255,255,255,0.5)' }]}>{id}</Text>
        ) : (
          <>
            <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.45)" />
            <Text style={styles.lockedNum}>{id}</Text>
          </>
        )}
        {playable && stars > 0 && <Stars count={stars} size={9} gap={0} empty="rgba(0,0,0,0.3)" />}
        {current && stars === 0 && <Text style={styles.newText}>{inProgress ? 'RESUME' : 'PLAY'}</Text>}
        {!current && inProgress && <Text style={styles.resumeText}>RESUME</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11141E' },
  message: { color: '#FFD3D3', textAlign: 'center', fontWeight: '700', marginBottom: 6 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  chapter: { marginBottom: 22 },
  banner: { height: 150, borderRadius: 24, overflow: 'hidden', borderWidth: 2, justifyContent: 'space-between' },
  chapterNum: { alignSelf: 'flex-start', margin: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  chapterNumText: { color: '#FFF', fontWeight: '900', fontSize: 11, letterSpacing: 1.5 },
  bannerBottom: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 18 },
  worldName: { color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: 0.5, textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  worldTag: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '700', marginTop: 2 },
  lockBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  starTotal: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  starTotalText: { color: '#FFF', fontWeight: '900', fontSize: 14, fontVariant: ['tabular-nums'] },
  progressTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, backgroundColor: 'rgba(0,0,0,0.5)' },
  progressFill: { height: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14, marginHorizontal: -5 },
  tile: { width: '25%', paddingHorizontal: 5, height: 84, marginBottom: 10 },
  tileLip: { position: 'absolute', left: 5, right: 5, top: 5, bottom: 0, borderRadius: 18 },
  tileFace: { height: 79, borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', gap: 2 },
  tileSheen: { position: 'absolute', top: 2, left: 5, right: 5, height: 30, borderRadius: 14 },
  tileNum: { color: '#FFF', fontSize: 26, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1 },
  lockedNum: { color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: '900' },
  newText: { color: '#4A2C00', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  resumeText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
});
