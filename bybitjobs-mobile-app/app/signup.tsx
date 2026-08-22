import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { signup, loginWithGoogle } = useAuth();

  // Get dynamic redirect parameters from job details if any
  const { redirectTitle } = useLocalSearchParams<{ redirectTitle: string }>();

  // State managers
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const [isGoogleAccountsModalVisible, setIsGoogleAccountsModalVisible] = React.useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = React.useState('');
  const [customGoogleName, setCustomGoogleName] = React.useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = React.useState(false);

  const defaultGoogleAccounts = [
    { name: 'Phạm Ngọc Thanh', email: 'thanh.nguyen@gmail.com', avatar: 'https://ui-avatars.com/api/?name=Pham+Ngoc+Thanh&background=2563EB&color=fff' },
    { name: 'Nguyễn Hoàng Đại', email: 'dai.hoang@gmail.com', avatar: 'https://ui-avatars.com/api/?name=Nguyen+Hoang+Dai&background=10B981&color=fff' },
    { name: 'Lê Thiện Nhân', email: 'nhan.le@gmail.com', avatar: 'https://ui-avatars.com/api/?name=Le+Thien+Nhan&background=F59E0B&color=fff' },
  ];

  const handleSelectGoogleAccount = async (selectedEmail: string, selectedName: string) => {
    setIsGoogleAccountsModalVisible(false);
    setIsGoogleLoading(true);
    const result = await loginWithGoogle(selectedEmail, selectedName);
    setIsGoogleLoading(false);

    if (!result.success) {
      Alert.alert('Đăng nhập Google', result.message);
      return;
    }

    Alert.alert(
      'Thành công',
      `Đăng nhập bằng Google thành công với tài khoản ${selectedEmail}!`,
      [
        {
          text: 'Đồng ý',
          onPress: () => {
            if (redirectTitle) {
              router.replace({
                pathname: '/apply-job',
                params: { title: redirectTitle }
              });
            } else {
              if (router.canGoBack()) {
                router.dismissAll();
              } else {
                router.replace('/(tabs)');
              }
            }
          },
        },
      ]
    );
  };

  const handleSignupSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập Họ và tên.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập Email.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Thông báo', 'Xác nhận mật khẩu không trùng khớp.');
      return;
    }

    const result = await signup(fullName.trim(), email.trim(), password);

    if (!result.success) {
      Alert.alert('Đăng ký thất bại', result.message);
      return;
    }

    Alert.alert(
      'Đăng ký thành công',
      'Tài khoản của bạn đã được khởi tạo thành công!',
      [
        {
          text: 'Đăng nhập ngay',
          onPress: () => {
            router.replace({
              pathname: '/login',
              params: {
                prefilledEmail: email.trim(),
                prefilledPassword: password,
                redirectTitle
              }
            });
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    router.push({
      pathname: '/login',
      params: { redirectTitle }
    });
  };

  const handleSocialLogin = async (platform: 'Google' | 'Facebook') => {
    if (platform === 'Google') {
      setIsGoogleAccountsModalVisible(true);
    } else {
      Alert.alert('Thông báo', `Tính năng đăng nhập qua ${platform} đang được cập nhật.`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Floating Absolute Back Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.back()}
        style={[styles.absoluteBackButton, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', shadowColor: '#000' }]}
      >
        <Ionicons name="arrow-back" size={22} color={isDark ? '#FFF' : '#11181C'} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Centered Login Card */}
          <View style={[styles.loginCard, isDark && styles.loginCardDark]}>
            
            {/* Blue Gradient Header Box */}
            <View style={styles.cardHeaderBg}>
              <Text style={styles.headerTitle}>BybitJobs</Text>
              <Text style={styles.headerSubtitle}>Kết nối công việc nhanh chóng</Text>
            </View>

            {/* Form Fields Body */}
            <View style={styles.cardBody}>
              <Text style={[styles.bodyTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Đăng ký</Text>

              {/* Full Name Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                  Họ và tên
                </Text>
                <View
                  style={[
                    styles.inputFieldWrapper,
                    {
                      borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                      backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8',
                    },
                  ]}
                >
                  <Ionicons name="person-outline" size={20} color="#8E8E93" style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                  Email
                </Text>
                <View
                  style={[
                    styles.inputFieldWrapper,
                    {
                      borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                      backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8',
                    },
                  ]}
                >
                  <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                    placeholder="email@gmail.com"
                    placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                  Mật khẩu
                </Text>
                <View
                  style={[
                    styles.inputFieldWrapper,
                    {
                      borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                      backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8',
                    },
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                    placeholder="**********"
                    placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#8E8E93"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                  Nhập lại mật khẩu
                </Text>
                <View
                  style={[
                    styles.inputFieldWrapper,
                    {
                      borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                      backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8',
                    },
                  ]}
                >
                  <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.textInput, { color: isDark ? '#FFF' : '#11181C' }]}
                    placeholder="**********"
                    placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#8E8E93"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Signup Action Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignupSubmit}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Đăng ký</Text>
              </TouchableOpacity>

              {/* Social Separator Row */}
              <View style={styles.separatorRow}>
                <View style={[styles.separatorLine, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]} />
                <Text style={styles.separatorText}>Hoặc đăng ký bằng</Text>
                <View style={[styles.separatorLine, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]} />
              </View>

              {/* Social Login Grid (Google & Facebook) */}
              <View style={styles.socialGrid}>
                {/* Google */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isGoogleLoading}
                  onPress={() => handleSocialLogin('Google')}
                  style={[
                    styles.socialButton,
                    {
                      borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                      backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8',
                    },
                  ]}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator size="small" color="#DB4437" style={{ marginRight: 6 }} />
                  ) : (
                    <Ionicons name="logo-google" size={16} color="#DB4437" style={styles.socialIcon} />
                  )}
                  <Text style={[styles.socialText, { color: isDark ? '#FFF' : '#11181C' }]}>
                    {isGoogleLoading ? 'Đang xử lý...' : 'Google'}
                  </Text>
                </TouchableOpacity>

                {/* Facebook */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSocialLogin('Facebook')}
                  style={[
                    styles.socialButton,
                    {
                      borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                      backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8',
                    },
                  ]}
                >
                  <Ionicons name="logo-facebook" size={16} color="#4267B2" style={styles.socialIcon} />
                  <Text style={[styles.socialText, { color: isDark ? '#FFF' : '#11181C' }]}>Facebook</Text>
                </TouchableOpacity>
              </View>

              {/* Outline Login Redirect Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLogin}
                style={styles.registerButton}
              >
                <Text style={styles.registerButtonText}>Đăng nhập</Text>
              </TouchableOpacity>

            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Chọn Tài Khoản Google */}
      <Modal
        visible={isGoogleAccountsModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsGoogleAccountsModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setIsGoogleAccountsModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', width: '90%', maxWidth: 360 }]}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/300/300221.png' }}
                style={{ width: 44, height: 44, marginBottom: 8 }}
              />
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#11181C', fontSize: 18 }]}>
                Đăng nhập với Google
              </Text>
              <Text style={{ color: isDark ? '#9BA1A6' : '#687076', fontSize: 13, marginTop: 2, textAlign: 'center' }}>
                Chọn một tài khoản để tiếp tục với BybitJobs
              </Text>
            </View>

            {defaultGoogleAccounts.map((acc, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onPress={() => handleSelectGoogleAccount(acc.email, acc.name)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA',
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: isDark ? '#3A3A3C' : '#E5E7EB',
                }}
              >
                <Image
                  source={{ uri: acc.avatar }}
                  style={{ width: 38, height: 38, borderRadius: 19, marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFF' : '#11181C' }}>
                    {acc.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: isDark ? '#9BA1A6' : '#687076' }}>
                    {acc.email}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#9BA1A6' : '#9CA3AF'} />
              </TouchableOpacity>
            ))}

            {!showCustomGoogleInput ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowCustomGoogleInput(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 12,
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
                <Text style={{ color: '#2563EB', fontWeight: '700', fontSize: 14 }}>
                  Sử dụng một tài khoản khác...
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ marginTop: 8, gap: 10 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA', color: isDark ? '#FFF' : '#000' }]}
                  placeholder="Nhập Gmail của bạn..."
                  placeholderTextColor={isDark ? '#8E8E93' : '#999'}
                  value={customGoogleEmail}
                  onChangeText={setCustomGoogleEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#2C2C2E' : '#F8F9FA', color: isDark ? '#FFF' : '#000' }]}
                  placeholder="Nhập Họ & Tên..."
                  placeholderTextColor={isDark ? '#8E8E93' : '#999'}
                  value={customGoogleName}
                  onChangeText={setCustomGoogleName}
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#2563EB',
                    borderRadius: 12,
                    height: 44,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    if (!customGoogleEmail.trim() || !customGoogleEmail.includes('@')) {
                      Alert.alert('Thông báo', 'Vui lòng nhập định dạng Email Google hợp lệ!');
                      return;
                    }
                    handleSelectGoogleAccount(customGoogleEmail.trim(), customGoogleName.trim() || customGoogleEmail.split('@')[0]);
                  }}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                    Đăng nhập tài khoản này
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsGoogleAccountsModalVisible(false)}
              style={{ marginTop: 12, paddingVertical: 8, alignItems: 'center' }}
            >
              <Text style={{ color: isDark ? '#9BA1A6' : '#687076', fontSize: 13, fontWeight: '600' }}>Hủy bỏ</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  loginCardDark: {
    backgroundColor: '#1C1C1E',
    shadowOpacity: 0.3,
  },
  cardHeaderBg: {
    height: Platform.OS === 'ios' ? 140 : 130,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  cardBody: {
    padding: 20,
  },
  bodyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 14,
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
    marginLeft: 6,
  },
  loginButton: {
    backgroundColor: '#0084FF',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    elevation: 4,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  separatorLine: {
    flex: 1,
    height: 1,
  },
  separatorText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    marginHorizontal: 12,
  },
  socialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 18,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  socialIcon: {
    marginRight: 8,
  },
  socialText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  registerButton: {
    borderWidth: 1.5,
    borderColor: '#0084FF',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#0084FF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  absoluteBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
