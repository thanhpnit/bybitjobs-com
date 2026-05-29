import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import axios from 'axios'; 

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { signup } = useAuth();

  const { redirectTitle } = useLocalSearchParams<{ redirectTitle: string }>();

  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

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
      Alert.alert('Thông báo', 'Mật khẩu nhập lại không khớp.');
      return;
    }

    try {
      console.log("=== ĐANG GỬI DATA ĐĂNG KÝ ===", email.trim());

      const response = await axios.post('http://10.0.2.2:5000/api/auth/register', {
        fullName: fullName.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      if (response.status === 201) {
        signup(email, fullName);

        Alert.alert(
          'Thành công',
          'Đăng ký tài khoản mới thành công!',
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
                  router.dismissAll(); 
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.log("========== LỖI ĐĂNG KÝ CHI TIẾT ==========");
      console.log(error);

      let errorMsg = 'Không thể kết nối tới Server. Vui lòng kiểm tra lại mạng hoặc IP!';
      if (error.response) {
        errorMsg = error.response.data?.message || `Lỗi Server: ${error.response.status}`;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      Alert.alert('Thông báo', errorMsg);
    }
  };

  const handleLogin = () => {
    router.push({
      pathname: '/login',
      params: { redirectTitle }
    });
  };

  const handleSocialLogin = (platform: 'Google' | 'Facebook') => {
    Alert.alert('Đăng nhập', `Bắt đầu kết nối tài khoản thông qua ${platform}...`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
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
          <View style={[styles.loginCard, isDark && styles.loginCardDark]}>
            
            <View style={styles.cardHeaderBg}>
              <Text style={styles.headerTitle}>BybitJobs</Text>
              <Text style={styles.headerSubtitle}>Kết nối công việc nhanh chóng</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={[styles.bodyTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Đăng ký</Text>

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

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignupSubmit}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Đăng ký</Text>
              </TouchableOpacity>

              <View style={styles.separatorRow}>
                <View style={[styles.separatorLine, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]} />
                <Text style={styles.separatorText}>Hoặc đăng ký bằng</Text>
                <View style={[styles.separatorLine, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]} />
              </View>

              <View style={styles.socialGrid}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSocialLogin('Google')}
                  style={[
                    styles.socialButton,
                    {
                      borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                      backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8',
                    },
                  ]}
                >
                  <Ionicons name="logo-google" size={16} color="#DB4437" style={styles.socialIcon} />
                  <Text style={[styles.socialText, { color: isDark ? '#FFF' : '#11181C' }]}>Google</Text>
                </TouchableOpacity>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardContainer: { flex: 1, justifyContent: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  loginCard: { backgroundColor: '#FFFFFF', width: '100%', maxWidth: 360, borderRadius: 18, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 },
  loginCardDark: { backgroundColor: '#1C1C1E', shadowOpacity: 0.3 },
  cardHeaderBg: { height: Platform.OS === 'ios' ? 140 : 130, backgroundColor: '#0084FF', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFF', marginBottom: 6 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '500' },
  cardBody: { padding: 20 },
  bodyTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputFieldWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, height: 46, paddingHorizontal: 14 },
  fieldIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 14, fontWeight: '500', height: '100%' },
  eyeBtn: { padding: 6, marginLeft: 6 },
  loginButton: { backgroundColor: '#0084FF', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 14, elevation: 4, shadowColor: '#0084FF', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 3 },
  loginButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  separatorRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  separatorLine: { flex: 1, height: 1 },
  separatorText: { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginHorizontal: 12 },
  socialGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  socialButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 10, borderWidth: 1 },
  socialIcon: { marginRight: 8 },
  socialText: { fontSize: 13, fontWeight: 'bold' },
  registerButton: { borderWidth: 1.5, borderColor: '#0084FF', borderRadius: 12, height: 48, justifyContent: 'center', alignItems: 'center' },
  registerButtonText: { color: '#0084FF', fontSize: 14, fontWeight: 'bold' },
  absoluteBackButton: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 16, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
});