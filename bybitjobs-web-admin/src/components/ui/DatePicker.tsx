import React, { createElement, forwardRef } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const DatePicker = forwardRef<any, DatePickerProps>(
  ({ value, onChange, label, style, inputStyle }, ref) => {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';

    return (
      <View style={[styles.container, style]}>
        {label && (
          <Typography variant="caption" color="secondary" style={styles.label}>
            {label}
          </Typography>
        )}
        <View style={[styles.inputContainer, { 
          backgroundColor: isDark ? colors.bgSecondary : '#FFF',
          borderColor: colors.borderLight 
        }]}>
          {createElement('input', {
            type: 'date',
            value,
            onChange: (e: any) => onChange(e.target.value),
            style: {
              width: '100%',
              height: 40,
              padding: '0 12px',
              border: 'none',
              background: 'transparent',
              outline: 'none',
              color: colors.textPrimary,
              fontFamily: 'inherit',
              fontSize: 14,
              colorScheme: isDark ? 'dark' : 'light',
            },
          })}
        </View>
      </View>
    );
  }
);

DatePicker.displayName = 'DatePicker';

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: 4,
    fontWeight: '500',
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
