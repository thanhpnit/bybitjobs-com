import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const NavigationThemeProvider = ThemeProvider as any;

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

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <ToastNotificationWrapper />
      </NavigationThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
