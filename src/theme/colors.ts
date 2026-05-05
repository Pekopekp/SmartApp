export const colors = {
  // Background
  bg: '#060B18',
  bgCard: '#0D1526',
  bgCardAlt: '#111D30',
  bgInner: '#080E1C',
  bgGlass: 'rgba(13,21,38,0.85)',

  // Accent
  primary: '#00E5FF',
  primaryDark: '#00A3B4',
  secondary: '#7C3AED',
  accent: '#10B981',
  accentWarm: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  success: '#22C55E',

  // Text
  textPrimary: '#F0F6FF',
  textSecondary: '#8BA3C7',
  textMuted: '#3D5278',

  // Gradients (pairs for LinearGradient)
  gradPh: ['#4F46E5', '#818CF8'] as [string, string],
  gradEc: ['#0891B2', '#22D3EE'] as [string, string],
  gradGas: ['#D97706', '#FCD34D'] as [string, string],
  gradTemp: ['#DC2626', '#F87171'] as [string, string],
  gradHumidity: ['#059669', '#34D399'] as [string, string],
  gradWater: ['#1D4ED8', '#60A5FA'] as [string, string],
  gradMotorOn: ['#16A34A', '#4ADE80'] as [string, string],
  gradMotorOff: ['#374151', '#6B7280'] as [string, string],
  gradHeader: ['#060B18', '#0D1526'] as [string, string],

  // Borders
  border: '#152035',
  borderActive: '#00E5FF',
  borderGlow: 'rgba(0,229,255,0.3)',

  // Status
  online: '#22C55E',
  offline: '#EF4444',
} as const;

export const typography = {
  fontFamily: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    display: 36,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};
