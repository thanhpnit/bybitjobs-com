import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption';
  color?: 'primary' | 'secondary' | 'muted' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  style?: TextStyle | TextStyle[];
  numberOfLines?: number;
}

export const Typography: React.FC<TypographyProps> = ({ 
  children, 
  variant = 'body1', 
  color = 'primary',
  style,
  numberOfLines
}) => {
  const { colors } = useTheme();

  const getTextColor = () => {
    switch (color) {
      case 'secondary': return colors.textSecondary;
      case 'muted': return colors.textMuted;
      case 'brand': return colors.primaryColor;
      case 'success': return colors.successText;
      case 'warning': return colors.warningText;
      case 'danger': return colors.dangerText;
      case 'info': return colors.infoText;
      case 'primary':
      default: return colors.textPrimary;
    }
  };

  return (
    <Text 
      style={[
        styles[variant],
        { color: getTextColor() },
        style
      ]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: { fontSize: 32, fontWeight: '700', fontFamily: 'Inter' },
  h2: { fontSize: 24, fontWeight: '600', fontFamily: 'Inter' },
  h3: { fontSize: 20, fontWeight: '600', fontFamily: 'Inter' },
  h4: { fontSize: 18, fontWeight: '600', fontFamily: 'Inter' },
  subtitle1: { fontSize: 16, fontWeight: '500', fontFamily: 'Inter' },
  subtitle2: { fontSize: 14, fontWeight: '500', fontFamily: 'Inter' },
  body1: { fontSize: 15, fontWeight: '400', fontFamily: 'Inter' },
  body2: { fontSize: 14, fontWeight: '400', fontFamily: 'Inter' },
  caption: { fontSize: 12, fontWeight: '400', fontFamily: 'Inter' },
});
