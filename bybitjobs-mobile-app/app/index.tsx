import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width, height } = Dimensions.get('window');

const onboardingSlides = [
  {
    id: 1,
    title: 'Cơ hội không giới hạn',
    description: 'Khám phá hàng ngàn công việc chất lượng từ các nhà tuyển dụng uy tín hàng đầu trên thị trường.',
    icon: 'briefcase-sharp',
    color: '#0084FF',
    highlightText: 'hàng ngàn công việc',
  },
  {
    id: 2,
    title: 'Hồ sơ năng lực chuyên nghiệp',
    description: 'Tải lên CV trực tiếp từ thiết bị của bạn chỉ trong vài giây, tiếp cận nhà tuyển dụng tức thời.',
    icon: 'document-text-sharp',
    color: '#34C759',
    highlightText: 'tiếp cận tức thời',
  },
  {
    id: 3,
    title: 'Thông báo tức thời',
    description: 'Nhận thông báo cập nhật về trạng thái hồ sơ ứng tuyển theo thời gian thực ngay trên điện thoại.',
    icon: 'notifications-sharp',
    color: '#5856D6',
    highlightText: 'thời gian thực',
  },
];

export default function WelcomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { isLoggedIn, isInitializing } = useAuth();

  const [activeSlideIndex, setActiveSlideIndex] = React.useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const logoScale = React.useRef(new Animated.Value(0.9)).current;
  const glowAnim = React.useRef(new Animated.Value(0.6)).current;

  // Animate logo heartbeat/glow
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 0.95, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Auto transition if already logged in
  React.useEffect(() => {
    if (!isInitializing) {
      if (isLoggedIn) {
        // Show splash for 1.8 seconds then auto redirect to tabs
        const timer = setTimeout(() => {
          router.replace('/(tabs)');
        }, 1800);
        return () => clearTimeout(timer);
      } else {
        // Fade in onboarding UI
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [isLoggedIn, isInitializing]);

  const handleNextSlide = () => {
    if (activeSlideIndex < onboardingSlides.length - 1) {
      setActiveSlideIndex(activeSlideIndex + 1);
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -15, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      router.replace('/(tabs)');
    }
  };

  const currentSlide = onboardingSlides[activeSlideIndex];

  // Splash Loading Screen
  if (isInitializing || isLoggedIn) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: '#151718' }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.splashContent}>
          {/* Futuristic Glowing Logo */}
          <Animated.View style={[styles.logoOuterGlow, { opacity: glowAnim }]}>
            <View style={styles.logoInnerGlow} />
          </Animated.View>
          
          <Animated.View style={[styles.logoIconWrapper, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.premiumLogoBg}>
              <Ionicons name="sparkles" size={32} color="#FFF" style={styles.logoSpark} />
              <Ionicons name="flash" size={44} color="#FFF" />
            </View>
          </Animated.View>

          {/* Stylized Brand Name */}
          <View style={styles.brandContainer}>
            <Text style={styles.brandFirst}>ByBit</Text>
            <Text style={styles.brandLast}>Jobs</Text>
          </View>
          
          <Text style={styles.splashTagline}>Tìm việc thông minh • Tuyển dụng chất lượng</Text>
          <ActivityIndicator size="small" color="#0084FF" style={{ marginTop: 32 }} />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* Onboarding Header with logo */}
        <View style={styles.header}>
          <View style={styles.miniLogoRow}>
            <View style={styles.miniLogo}>
              <Ionicons name="flash" size={16} color="#FFF" />
            </View>
            <Text style={[styles.miniBrandFirst, { color: isDark ? '#FFF' : '#0B0F19' }]}>ByBit</Text>
            <Text style={styles.miniBrandLast}>Jobs</Text>
          </View>

          {/* Skip button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.replace('/(tabs)')}
            style={styles.skipBtn}
          >
            <Text style={[styles.skipBtnText, { color: isDark ? '#8E8E93' : '#687076' }]}>Bỏ qua</Text>
            <Ionicons name="chevron-forward" size={14} color={isDark ? '#8E8E93' : '#687076'} />
          </TouchableOpacity>
        </View>

        {/* Feature Icon Card with Glowing Circle */}
        <Animated.View 
          style={[
            styles.illustrationContainer, 
            { 
              transform: [{ translateY: slideAnim }],
              backgroundColor: isDark ? '#1C1C1E' : '#EAF4FE',
              borderColor: isDark ? 'rgba(0, 132, 255, 0.1)' : 'rgba(0, 132, 255, 0.15)',
            }
          ]}
        >
          {/* Glowing background ring */}
          <View style={[styles.glowRing, { borderColor: currentSlide.color }]} />
          
          <View style={[styles.iconCircleBig, { backgroundColor: currentSlide.color }]}>
            <Ionicons name={currentSlide.icon as any} size={48} color="#FFF" />
          </View>
        </Animated.View>

        {/* Info Area */}
        <View style={styles.infoArea}>
          <Text style={[styles.slideTitle, { color: isDark ? '#FFF' : '#0B0F19' }]}>
            {currentSlide.title}
          </Text>
          
          <Text style={[styles.slideDescription, { color: isDark ? '#9BA1A6' : '#687076' }]}>
            {currentSlide.description}
          </Text>

          {/* Dots Indicator */}
          <View style={styles.dotsWrapper}>
            {onboardingSlides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: activeSlideIndex === index ? 24 : 8,
                    backgroundColor: activeSlideIndex === index ? '#0084FF' : (isDark ? '#2C2C2E' : '#CFD8DC'),
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Actions Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNextSlide}
            style={[styles.primaryBtn, { backgroundColor: '#0084FF' }]}
          >
            <Text style={styles.primaryBtnText}>
              {activeSlideIndex === onboardingSlides.length - 1 ? 'Khám phá ngay' : 'Tiếp tục'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {activeSlideIndex === onboardingSlides.length - 1 && (
            <View style={styles.loginOptionRow}>
              <Text style={{ color: isDark ? '#8E8E93' : '#687076', fontSize: 14 }}>Đã có tài khoản?</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/login')}
                style={{ marginLeft: 6 }}
              >
                <Text style={styles.loginLinkText}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  miniLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  miniBrandFirst: {
    fontSize: 16,
    fontWeight: '800',
  },
  miniBrandLast: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0084FF',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  illustrationContainer: {
    height: height * 0.32,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  glowRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    position: 'absolute',
    opacity: 0.25,
  },
  iconCircleBig: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  infoArea: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.6,
  },
  slideDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 28,
  },
  dotsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    marginBottom: 16,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  loginOptionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  loginLinkText: {
    color: '#0084FF',
    fontSize: 14,
    fontWeight: '800',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconWrapper: {
    width: 104,
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  premiumLogoBg: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  logoSpark: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  logoOuterGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 132, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logoInnerGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(0, 132, 255, 0.25)',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  brandFirst: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
  },
  brandLast: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0084FF',
    letterSpacing: -1,
  },
  splashTagline: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
