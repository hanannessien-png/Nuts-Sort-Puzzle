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
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    textMuted: '#64748B',
    primary: '#3B82F6',
    primaryMuted: '#DBEAFE',
    border: '#E2E8F0',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
  },
  midnight: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    primary: '#60A5FA',
    primaryMuted: '#1E3A8A',
    border: '#334155',
    danger: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
  },
  ocean: {
    background: '#F0F9FF',
    surface: '#FFFFFF',
    text: '#0C4A6E',
    textMuted: '#0284C7',
    primary: '#0EA5E9',
    primaryMuted: '#E0F2FE',
    border: '#BAE6FD',
    danger: '#E11D48',
    success: '#059669',
    warning: '#D97706',
  },
  blossom: {
    background: '#FDF2F8',
    surface: '#FFFFFF',
    text: '#831843',
    textMuted: '#BE185D',
    primary: '#EC4899',
    primaryMuted: '#FCE7F3',
    border: '#FBCFE8',
    danger: '#E11D48',
    success: '#10B981',
    warning: '#F59E0B',
  },
  candy: {
    background: '#FAF5FF',
    surface: '#FFFFFF',
    text: '#581C87',
    textMuted: '#7E22CE',
    primary: '#A855F7',
    primaryMuted: '#F3E8FF',
    border: '#E9D5FF',
    danger: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
  },
};

export const NUT_PALETTES: Record<string, string[]> = {
  default: [
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#14B8A6', // Teal
  ],
  pastel: [
    '#FCA5A5',
    '#93C5FD',
    '#6EE7B7',
    '#FCD34D',
    '#C4B5FD',
    '#FDBA74',
    '#F9A8D4',
    '#67E8F9',
    '#BEF264',
    '#5EEAD4',
  ],
  neon: [
    '#FF003C',
    '#00E5FF',
    '#39FF14',
    '#FFE600',
    '#BF00FF',
    '#FF5F00',
    '#FF00A0',
    '#00FFFF',
    '#CCFF00',
    '#00FF85',
  ]
};
