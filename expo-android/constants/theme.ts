export const THEMES: Record<string, {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryMuted: string;
  border: string;
  danger: string;
  success: string;
  warning: string;
}> = {
  default: { 
    background: '#F0EBE1', 
    surface: '#FDFBF7', 
    text: '#2A2624', 
    textMuted: '#8C857E',
    primary: '#C46D42', 
    primaryMuted: '#EED9CE',
    border: '#DED8D0',
    danger: '#D95047',
    success: '#4E8A63',
    warning: '#D49A36',
  },
  midnight: { 
    background: '#1A1817',
    surface: '#262423',
    text: '#F0EBE1',
    textMuted: '#A69E96',
    primary: '#D98A60',
    primaryMuted: '#5C3A27',
    border: '#3D3A38',
    danger: '#E06B62',
    success: '#629E74',
    warning: '#E6B24D',
  },
  ocean: {
    background: '#152129',
    surface: '#20303A',
    text: '#E8F1F5',
    textMuted: '#9AB2C2',
    primary: '#4795AB',
    primaryMuted: '#244F5E',
    border: '#324654',
    danger: '#D95047',
    success: '#4E8A63',
    warning: '#CCA352',
  },
  blossom: {
    background: '#2B1B22',
    surface: '#3D2833',
    text: '#F5EBF0',
    textMuted: '#C2A3B3',
    primary: '#B85481',
    primaryMuted: '#5C2A40',
    border: '#543B47',
    danger: '#D95047',
    success: '#4E8A63',
    warning: '#CCA352',
  },
  candy: {
    background: '#211B29',
    surface: '#2E2638',
    text: '#EFEBF5',
    textMuted: '#AFA3C2',
    primary: '#8854B8',
    primaryMuted: '#442A5C',
    border: '#453B54',
    danger: '#D95047',
    success: '#4E8A63',
    warning: '#CCA352',
  },
};

export const NUT_PALETTES: Record<string, string[]> = {
  default: [
    '#C43D35', // Ruby
    '#3B6BC4', // Sapphire
    '#418A53', // Emerald
    '#D99C2B', // Gold
    '#744A99', // Amethyst
    '#C96B32', // Copper
    '#B53F6F', // Rose
    '#3399B5', // Turquoise
    '#82A133', // Olivine
    '#2E8282', // Teal
  ],
  pastel: [
    '#D97C77',
    '#779CD9',
    '#7C9E87',
    '#E6B96E',
    '#A082B3',
    '#D99777',
    '#CC7E9E',
    '#77BBD9',
    '#A4BD72',
    '#6EA6A6',
  ],
  neon: [
    '#FF3333',
    '#3388FF',
    '#33FF66',
    '#FFCC00',
    '#9933FF',
    '#FF7700',
    '#FF3399',
    '#00EEEE',
    '#AAFF00',
    '#00FF99',
  ]
};
