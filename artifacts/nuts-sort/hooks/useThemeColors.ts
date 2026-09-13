import { useGame } from '@/game/GameProvider';
import { THEMES, NUT_PALETTES } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export function useThemeColors() {
  const game = useGame();
  
  let appearance = 'default';
  if (game?.state?.equipped?.themes && game.catalog) {
    const item = game.catalog.find(i => i.id === game.state.equipped.themes);
    if (item && item.appearance) appearance = item.appearance;
  }
  
  // For fallback if game context isn't ready
  const systemColorScheme = useColorScheme();
  const fallback = systemColorScheme === 'dark' ? 'midnight' : 'default';
  
  const themeKey = THEMES[appearance] ? appearance : fallback;
  return THEMES[themeKey] || THEMES.default;
}

export function useNutPalette() {
  const game = useGame();
  let appearance = 'default';
  if (game?.state?.equipped?.nuts && game.catalog) {
    const item = game.catalog.find(i => i.id === game.state.equipped.nuts);
    if (item && item.appearance) appearance = item.appearance;
  }
  return NUT_PALETTES[appearance] || NUT_PALETTES.default;
}

export function useBaseAppearance() {
  const game = useGame();
  let appearance = 'default';
  if (game?.state?.equipped?.bases && game.catalog) {
    const item = game.catalog.find(i => i.id === game.state.equipped.bases);
    if (item && item.appearance) appearance = item.appearance;
  }
  return appearance;
}

export function useBoltAppearance() {
  const game = useGame();
  let appearance = 'default';
  if (game?.state?.equipped?.bolts && game.catalog) {
    const item = game.catalog.find(i => i.id === game.state.equipped.bolts);
    if (item && item.appearance) appearance = item.appearance;
  }
  return appearance;
}
