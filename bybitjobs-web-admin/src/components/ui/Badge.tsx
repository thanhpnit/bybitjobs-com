import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';

export type BadgeStatus = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  status?: BadgeStatus;
  style?: ViewStyle | ViewStyle[];
}

export const Badge: React.FC<BadgeProps> = ({ children, status = 'default', style }) => {
  const { colors } = useTheme();

  const getBadgeStyle = () => {
    switch (status) {
      case 'success':
        return { bg: colors.successBg, text: 'success' as const };
      case 'warning':
        return { bg: colors.warningBg, text: 'warning' as const };
      case 'danger':
        return { bg: colors.dangerBg, text: 'danger' as const };
      case 'info':
        return { bg: colors.infoBg, text: 'info' as const };
      case 'default':
      default:
        return { bg: colors.bgPrimary, text: 'secondary' as const };
    }
  };

  const { bg, text } = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Typography variant="caption" color={text} style={styles.text}>
        {children}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  }
});
