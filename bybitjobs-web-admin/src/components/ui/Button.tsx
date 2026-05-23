import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  textStyle
}) => {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return colors.primaryColor;
      case 'secondary': return colors.bgPrimary;
      case 'danger': return colors.dangerColor;
      case 'outline': 
      case 'ghost': 
        return 'transparent';
      default: return colors.primaryColor;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': 
      case 'danger':
        return '#FFFFFF';
      case 'secondary': 
      case 'outline': 
      case 'ghost': 
        return colors.textPrimary;
      default: return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.borderLight;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        styles[size],
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0
        },
        style
      ]}
    >
      {icon}
      <Typography 
        variant="subtitle2" 
        style={[
          { color: getTextColor(), marginLeft: icon ? 8 : 0 },
          textStyle
        ]}
      >
        {children}
      </Typography>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  sm: { paddingVertical: 6, paddingHorizontal: 12 },
  md: { paddingVertical: 10, paddingHorizontal: 16 },
  lg: { paddingVertical: 14, paddingHorizontal: 24 },
});
