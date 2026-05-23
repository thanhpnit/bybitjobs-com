import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { useTheme } from '../../context/ThemeContext';
import { AlertTriangle, X } from 'lucide-react-native';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  visible, 
  title, 
  message, 
  confirmText = "Xác nhận", 
  cancelText = "Hủy",
  isDanger = true,
  onConfirm, 
  onClose 
}) => {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.modalBox, { backgroundColor: colors.bgPrimary }]}>
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <Typography variant="h3">{title}</Typography>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <View style={styles.messageRow}>
            {isDanger && <AlertTriangle size={24} color={colors.dangerColor || '#EF4444'} style={{ marginRight: 12 }} />}
            <Typography variant="body1" style={{ flex: 1 }}>{message}</Typography>
          </View>
        </View>
        <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
          <Button variant="outline" onPress={onClose} style={styles.footerBtn}>
            {cancelText}
          </Button>
          <Button 
            onPress={() => {
              onConfirm();
              onClose();
            }} 
            style={[styles.footerBtn, isDanger ? { backgroundColor: colors.dangerColor || '#EF4444' } : undefined]}
          >
            {confirmText}
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'fixed' as any,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalBox: {
    width: 400,
    maxWidth: '90%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 24,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  footerBtn: {
    minWidth: 100,
  }
});
