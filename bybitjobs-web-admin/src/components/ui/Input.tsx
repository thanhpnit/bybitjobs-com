import React from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, ...props }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {label && <Typography variant="subtitle2" style={styles.label}>{label}</Typography>}
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.bgSecondary, 
            borderColor: error ? colors.dangerColor : colors.borderLight,
            color: colors.textPrimary 
          },
          style
        ]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error && <Typography variant="caption" color="danger" style={styles.error}>{error}</Typography>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  error: {
    marginTop: 4,
  }
});
