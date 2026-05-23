import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeType = 'light' | 'dark';

export const Colors = {
  light: {
    bgPrimary: '#F4F6F8',
    bgSecondary: '#FFFFFF',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    borderColor: '#E5E7EB',
    borderLight: '#F3F4F6',
    primaryColor: '#0066FF',
    primaryHover: '#0052CC',
    primaryLight: '#E5F0FF',
    successBg: '#D1FAE5',
    successText: '#047857',
    warningBg: '#FEF3C7',
    warningText: '#B45309',
    dangerColor: '#EF4444',
    dangerBg: '#FEE2E2',
    dangerText: '#B91C1C',
    infoBg: '#DBEAFE',
    infoText: '#1D4ED8',
  },
  dark: {
    bgPrimary: '#121212',
    bgSecondary: '#1E1E1E',
    textPrimary: '#F3F4F6',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    borderColor: '#2D3748',
    borderLight: '#252D3D',
    primaryColor: '#3B82F6',
    primaryHover: '#60A5FA',
    primaryLight: 'rgba(59, 130, 246, 0.15)',
    successBg: 'rgba(16, 185, 129, 0.15)',
    successText: '#34D399',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    warningText: '#FBBF24',
    dangerColor: '#EF4444',
    dangerBg: 'rgba(239, 68, 68, 0.15)',
    dangerText: '#F87171',
    infoBg: 'rgba(59, 130, 246, 0.15)',
    infoText: '#60A5FA',
  }
};

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: typeof Colors.light;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const currentColors = Colors[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors: currentColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
