import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ModalType = 'confirm' | 'success' | 'danger' | 'warning' | 'info';

export interface CustomModalProps {
  visible: boolean;
  type?: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  showCancel?: boolean;
}

export default function CustomModal({
  visible,
  type = 'confirm',
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  onConfirm,
  onCancel,
  onClose,
  showCancel = true,
}: CustomModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const scaleValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else {
      scaleValue.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  let iconName: keyof typeof Ionicons.glyphMap = 'help-circle-outline';
  let iconColor = '#0084FF';
  let iconBgColor = isDark ? '#1C2A3A' : '#EBF5FF';
  let confirmBtnBg = '#0084FF';

  if (type === 'success') {
    iconName = 'checkmark-circle';
    iconColor = '#10B981';
    iconBgColor = isDark ? '#064E3B' : '#ECFDF5';
    confirmBtnBg = '#10B981';
  } else if (type === 'danger') {
    iconName = 'trash-bin-outline';
    iconColor = '#EF4444';
    iconBgColor = isDark ? '#451A1A' : '#FEF2F2';
    confirmBtnBg = '#EF4444';
  } else if (type === 'warning') {
    iconName = 'warning-outline';
    iconColor = '#F59E0B';
    iconBgColor = isDark ? '#452A0A' : '#FEF3C7';
    confirmBtnBg = '#F59E0B';
  } else if (type === 'info') {
    iconName = 'information-circle-outline';
    iconColor = '#0084FF';
    iconBgColor = isDark ? '#1C2A3A' : '#EBF5FF';
    confirmBtnBg = '#0084FF';
  }

  const handleClose = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  transform: [{ scale: scaleValue }],
                },
              ]}
            >
              {/* Icon Header Badge */}
              <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
                <Ionicons name={iconName} size={36} color={iconColor} />
              </View>

              {/* Title & Message */}
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#11181C' }]}>
                {title}
              </Text>
              <Text style={[styles.message, { color: isDark ? '#9BA1A6' : '#64748B' }]}>
                {message}
              </Text>

              {/* Action Buttons Row */}
              <View style={styles.buttonRow}>
                {showCancel && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      if (onCancel) onCancel();
                      else if (onClose) onClose();
                    }}
                    style={[
                      styles.btn,
                      styles.cancelBtn,
                      { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' },
                    ]}
                  >
                    <Text style={[styles.cancelBtnText, { color: isDark ? '#9BA1A6' : '#64748B' }]}>
                      {cancelText}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    if (onConfirm) onConfirm();
                  }}
                  style={[
                    styles.btn,
                    styles.confirmBtn,
                    { backgroundColor: confirmBtnBg, flex: showCancel ? 1 : 0, width: showCancel ? undefined : '100%' },
                  ]}
                >
                  <Text style={styles.confirmBtnText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

let globalShowModal: ((config: any) => void) | null = null;

export const showAppModal = (config: {
  type?: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}) => {
  if (globalShowModal) {
    globalShowModal(config);
  }
};

export function GlobalAppModal() {
  const [modalState, setModalState] = React.useState<any>({
    visible: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Đồng ý',
    cancelText: 'Đóng',
    showCancel: true,
  });

  React.useEffect(() => {
    globalShowModal = (config: any) => {
      setModalState({
        visible: true,
        type: config.type || 'confirm',
        title: config.title || 'Thông báo',
        message: config.message || '',
        confirmText: config.confirmText || 'Đồng ý',
        cancelText: config.cancelText || 'Đóng',
        showCancel: config.showCancel !== undefined ? config.showCancel : true,
        onConfirm: config.onConfirm,
        onCancel: config.onCancel,
      });
    };

    return () => {
      globalShowModal = null;
    };
  }, []);

  return (
    <CustomModal
      visible={modalState.visible}
      type={modalState.type}
      title={modalState.title}
      message={modalState.message}
      confirmText={modalState.confirmText}
      cancelText={modalState.cancelText}
      showCancel={modalState.showCancel}
      onConfirm={() => {
        setModalState((prev: any) => ({ ...prev, visible: false }));
        if (modalState.onConfirm) modalState.onConfirm();
      }}
      onCancel={() => {
        setModalState((prev: any) => ({ ...prev, visible: false }));
        if (modalState.onCancel) modalState.onCancel();
      }}
    />
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: Math.min(width - 48, 380),
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 26,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  btn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cancelBtn: {
    flex: 1,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
