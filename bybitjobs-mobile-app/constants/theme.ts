import { Platform } from 'react-native';

const tintColorLight = '#0F172A';
const tintColorDark = '#0F172A';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#FFFFFF',
    cardBackground: '#FFFFFF',
    surface: '#F8FAFC',
    border: '#E2E8F0',
    tint: tintColorLight,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#0F172A',
    background: '#FFFFFF',
    cardBackground: '#FFFFFF',
    surface: '#F8FAFC',
    border: '#E2E8F0',
    tint: tintColorDark,
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorDark,
  },
};

// Uniform font definition across all platforms
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'System',
    rounded: 'System',
    mono: 'System',
  },
  android: {
    sans: 'sans-serif',
    serif: 'sans-serif',
    rounded: 'sans-serif',
    mono: 'sans-serif',
  },
  default: {
    sans: 'sans-serif',
    serif: 'sans-serif',
    rounded: 'sans-serif',
    mono: 'sans-serif',
  },
  web: {
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    rounded: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
});

