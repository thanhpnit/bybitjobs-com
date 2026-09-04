import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function ToastNotificationWrapper() {
  const { activeToast, dismissToast } = useAuth();
  const [currentToast, setCurrentToast] = React.useState<any>(null);
  const slideAnim = React.useRef(new Animated.Value(-150)).current;
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  React.useEffect(() => {
    if (activeToast) {
      setCurrentToast(activeToast);
      // Slide down animation
      Animated.spring(slideAnim, {
        toValue: insets.top + 10,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();
    } else if (currentToast) {
      // Slide up animation
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentToast(null);
      });
    }
  }, [activeToast, insets.top]);

  const handleManualDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      dismissToast();
      setCurrentToast(null);
    });
  };

  if (!currentToast) return null;

  const isDark = colorScheme === 'dark';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: isDark ? 'rgba(28, 28, 30, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      <View style={styles.toastHeader}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(245, 166, 35, 0.15)' : 'rgba(255, 149, 0, 0.1)' }]}>
          <Ionicons 
            name="notifications" 
            size={22} 
            color={isDark ? '#F5A623' : '#FF9500'} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.toastTitle, { color: isDark ? '#FFF' : '#1C1C1E' }]} numberOfLines={1}>
            {currentToast.title}
          </Text>
          <Text style={[styles.toastDescription, { color: isDark ? '#AEAEB2' : '#636366' }]} numberOfLines={2}>
            {currentToast.description}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={handleManualDismiss}>
          <Ionicons name="close" size={20} color={isDark ? '#8E8E93' : '#8E8E93'} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

import { GlobalAppModal, showAppModal } from '@/components/custom-modal';
import { Alert } from 'react-native';

// Overriding standard Alert.alert globally with our high-end Custom Confirmation Popup Modal
const nativeAlert = Alert.alert;
Alert.alert = (title: string, message?: string, buttons?: any[], options?: any) => {
  if (!buttons || buttons.length === 0) {
    const textCombined = (title + (message || '')).toLowerCase();
    const isSuccess = textCombined.includes('thành công') || textCombined.includes('đã cập nhật') || textCombined.includes('hoàn tất');
    showAppModal({
      type: isSuccess ? 'success' : 'info',
      title: title || 'Thông báo',
      message: message || '',
      confirmText: 'Đã hiểu',
      showCancel: false,
    });
    return;
  }

  if (buttons.length === 1) {
    const btn = buttons[0];
    const textCombined = (title + (message || '')).toLowerCase();
    const isSuccess = textCombined.includes('thành công') || textCombined.includes('đã cập nhật') || textCombined.includes('hoàn tất');
    showAppModal({
      type: isSuccess ? 'success' : 'info',
      title: title || 'Thông báo',
      message: message || '',
      confirmText: btn.text || 'Đồng ý',
      showCancel: false,
      onConfirm: btn.onPress,
    });
    return;
  }

  // Multiple buttons (Confirmation dialogs)
  const cancelBtn = buttons.find((b) => b.style === 'cancel' || b.text?.toLowerCase().includes('hủy') || b.text?.toLowerCase().includes('đóng') || b.text?.toLowerCase().includes('thoát'));
  const confirmBtn = buttons.find((b) => b !== cancelBtn) || buttons[1];

  const textCombined = (title + (message || '')).toLowerCase();
  let modalType: 'confirm' | 'success' | 'danger' | 'warning' | 'info' = 'confirm';

  if (textCombined.includes('xóa') || textCombined.includes('hủy') || textCombined.includes('đăng xuất') || textCombined.includes('khóa') || confirmBtn?.style === 'destructive') {
    modalType = 'danger';
  } else if (textCombined.includes('cảnh báo') || textCombined.includes('lưu ý')) {
    modalType = 'warning';
  } else if (textCombined.includes('thành công') || textCombined.includes('kích hoạt')) {
    modalType = 'success';
  }

  showAppModal({
    type: modalType,
    title: title || 'Xác nhận',
    message: message || '',
    cancelText: cancelBtn?.text || 'Hủy bỏ',
    confirmText: confirmBtn?.text || 'Xác nhận',
    showCancel: true,
    onCancel: cancelBtn?.onPress,
    onConfirm: confirmBtn?.onPress,
  });
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <Stack screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? '#151718' : '#F8F9FA' }
        }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ToastNotificationWrapper />
        <GlobalAppModal />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  toastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  toastDescription: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  closeButton: {
    padding: 4,
  },
});
