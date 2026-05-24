import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ApplyJobScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // Get dynamic title from parameters
  const { title } = useLocalSearchParams<{ title: string }>();
  const displayTitle = title || 'Nhân viên phục vụ quán cà phê The Coffee House';

  // Form states
  const [fullName, setFullName] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [cvUploaded, setCvUploaded] = React.useState(false);

  const handleUploadCV = () => {
    // Mock upload success
    setCvUploaded(true);
    Alert.alert('Thành công', 'Đã tải lên hồ sơ năng lực thành công!');
  };

  const handleSubmit = () => {
    if (!fullName.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập số điện thoại liên hệ.');
      return;
    }
    if (!cvUploaded) {
      Alert.alert('Thông báo', 'Vui lòng tải lên CV hoặc Hồ sơ năng lực của bạn.');
      return;
    }

    Alert.alert(
      'Thành công',
      'Hồ sơ ứng tuyển của bạn đã được gửi đi thành công!',
      [
        {
          text: 'Đồng ý',
          onPress: () => router.dismissAll(), // Go back to Home
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Dark blue gradient-like header */}
      <View style={styles.headerBg} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gửi hồ sơ ứng tuyển</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {/* Scrollable Form */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Job Summary Card */}
          <View style={[styles.whiteCard, isDark && styles.darkCard]}>
            <View style={styles.jobInfoRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#152E47' : '#E6F4FE' }]}>
                <Ionicons name="storefront-outline" size={22} color="#0084FF" />
              </View>
              <View style={styles.jobTextCol}>
                <Text style={[styles.jobTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {displayTitle}
                </Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={14} color="#8E8E93" />
                  <Text style={styles.locationText}>Quận 1, TP. Hồ Chí Minh</Text>
                </View>
              </View>
            </View>

            {/* Expected Salary Banner */}
            <View style={[styles.salaryBanner, { backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}>
              <Text style={[styles.salaryLabel, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                Mức lương dự kiến
              </Text>
              <Text style={styles.salaryValue}>25k - 30k / giờ</Text>
            </View>
          </View>

          {/* Personal Information Form Card */}
          <View style={[styles.whiteCard, styles.formCard, isDark && styles.darkCard]}>
            <Text style={[styles.formTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Thông tin cá nhân</Text>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#ECEDEE' : '#333' }]}>
                Họ và tên <Text style={styles.star}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: isDark ? '#FFF' : '#11181C',
                    borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                    backgroundColor: isDark ? '#1C1C1E' : '#FFF',
                  },
                ]}
                placeholder="Nhập họ và tên của bạn"
                placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#ECEDEE' : '#333' }]}>
                Số điện thoại <Text style={styles.star}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: isDark ? '#FFF' : '#11181C',
                    borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                    backgroundColor: isDark ? '#1C1C1E' : '#FFF',
                  },
                ]}
                placeholder="Ví dụ: 0912345678"
                placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#ECEDEE' : '#333' }]}>
                Email (Không bắt buộc)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: isDark ? '#FFF' : '#11181C',
                    borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                    backgroundColor: isDark ? '#1C1C1E' : '#FFF',
                  },
                ]}
                placeholder="Nhập địa chỉ email"
                placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Cover Message */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#ECEDEE' : '#333' }]}>
                Lời nhắn cho nhà tuyển dụng
              </Text>
              <TextInput
                style={[
                  styles.textAreaInput,
                  {
                    color: isDark ? '#FFF' : '#11181C',
                    borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                    backgroundColor: isDark ? '#1C1C1E' : '#FFF',
                  },
                ]}
                placeholder="Giới thiệu ngắn gọn về kinh nghiệm hoặc lý do bạn phù hợp với công việc này..."
                placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
              />
            </View>

            {/* CV Upload Section */}
            <View style={styles.inputGroup}>
              <View style={styles.uploadHeader}>
                <Text style={[styles.inputLabel, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Tải lên CV / Hồ sơ năng lực
                </Text>
                <Text style={styles.uploadLimit}>Tối đa 5MB</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleUploadCV}
                style={[
                  styles.uploadBox,
                  {
                    borderColor: cvUploaded ? '#0084ffff' : (isDark ? '#2C2C2E' : '#CFD8DC'),
                    backgroundColor: cvUploaded
                      ? (isDark ? '#102538' : '#F0F8FF')
                      : (isDark ? '#1C1C1E' : '#F8FAFC'),
                  },
                ]}
              >
                <View style={[styles.uploadIconCircle, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons
                    name={cvUploaded ? 'checkmark-done-circle-outline' : 'cloud-upload-outline'}
                    size={26}
                    color="#0084FF"
                  />
                </View>
                <Text style={[styles.uploadTextBold, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {cvUploaded ? 'CV đã được tải lên thành công' : 'Nhấn để chọn file hoặc ảnh'}
                </Text>
                <Text style={styles.uploadTextSub}>
                  {cvUploaded ? 'Bấm để chọn file khác thay thế' : 'Hỗ trợ định dạng: PDF, DOCX, JPG, PNG'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Send Application Button */}
            <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit} style={styles.submitButton}>
              <Ionicons name="paper-plane" size={18} color="#FFF" style={styles.submitIcon} />
              <Text style={styles.submitButtonText}>Gửi hồ sơ</Text>
            </TouchableOpacity>

            {/* Agreement Terms Link Text */}
            <View style={styles.agreementWrapper}>
              <Text style={styles.agreementText}>
                {"Bằng việc nhấn \"Gửi hồ sơ\", bạn đồng ý với "}
                <Text style={styles.linkText} onPress={() => Alert.alert('Điều khoản', 'Trang Điều khoản dịch vụ.')}>
                  điều khoản
                </Text>{' '}
                và{' '}
                <Text style={styles.linkText} onPress={() => Alert.alert('Bảo mật', 'Trang Chính sách bảo mật.')}>
                  Chính sách bảo mật
                </Text>{' '}
                của chúng tôi.
              </Text>
            </View>
          </View>

          {/* Padding bottom */}
          <View style={styles.scrollPaddingBottom} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 120 : 100,
    backgroundColor: '#0084FF', // Match screenshot dark blue
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginRight: 36, // Balance the back button on left
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  darkCard: {
    backgroundColor: '#1C1C1E',
    shadowOpacity: 0.2,
  },
  jobInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  salaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  salaryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  salaryValue: {
    color: '#0084FF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formCard: {
    padding: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  star: {
    color: '#FF3D00',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 10,
    height: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadLimit: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadTextBold: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadTextSub: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#0084FF',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    elevation: 4,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  submitIcon: {
    marginRight: 4,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  agreementWrapper: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  agreementText: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  linkText: {
    color: '#0084FF',
    fontWeight: 'bold',
  },
  scrollPaddingBottom: {
    height: 30,
  },
});
