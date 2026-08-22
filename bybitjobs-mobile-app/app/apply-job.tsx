import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

export default function ApplyJobScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { submitApplication, userData, isLoggedIn, isInitializing } = useAuth();
  const hasShownVerificationAlert = React.useRef(false);

  // Get dynamic title from parameters
  const { title, jobId, companyName, salary, location } = useLocalSearchParams<{
    title: string;
    jobId?: string;
    companyName?: string;
    salary?: string;
    location?: string;
  }>();
  const displayTitle = title || 'Vị trí tuyển dụng';
  const displayCompanyName = companyName || 'Doanh nghiệp tuyển dụng';
  const displaySalary = salary || 'Thỏa thuận';
  const displayLocation = location || 'Chưa cập nhật địa điểm';

  // Form states
  const [fullName, setFullName] = React.useState(userData?.fullName || '');
  const [phoneNumber, setPhoneNumber] = React.useState(userData?.phone || (userData?.emailOrPhone?.match(/^[0-9+]+$/) ? userData?.emailOrPhone : '') || '');
  const [email, setEmail] = React.useState(userData?.emailOrPhone || '');
  const [message, setMessage] = React.useState('');
  const [cvUploaded, setCvUploaded] = React.useState(!!userData?.cvUrl);
  const [cvFile, setCvFile] = React.useState<{ name: string; size: string; uploadTime: string; url?: string } | null>(() => {
    if (userData?.cvUrl) {
      return {
        name: userData.cvName || 'CV_Hoso.pdf',
        size: userData.cvSize || 'Đã lưu',
        uploadTime: userData.cvUploadTime || 'Đã cập nhật',
        url: userData.cvUrl,
      };
    }
    return null;
  });

  React.useEffect(() => {
    if (userData) {
      if (userData.fullName && !fullName) {
        setFullName(userData.fullName);
      }
      if ((userData.phone || userData.emailOrPhone) && !phoneNumber) {
        setPhoneNumber(userData.phone || (userData.emailOrPhone?.match(/^[0-9+]+$/) ? userData.emailOrPhone : ''));
      }
      if (userData.emailOrPhone && !email) {
        setEmail(userData.emailOrPhone);
      }
      if (userData.cvUrl && !cvUploaded) {
        setCvUploaded(true);
        setCvFile({
          name: userData.cvName || 'CV_Hoso.pdf',
          size: userData.cvSize || 'Đã lưu',
          uploadTime: userData.cvUploadTime || 'Đã cập nhật',
          url: userData.cvUrl,
        });
      }
    }
  }, [userData]);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = React.useState(false);

  const handleGenerateAICoverLetter = async () => {
    if (!fullName.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập họ và tên của bạn trước để AI cá nhân hóa thư xin việc.');
      return;
    }

    setIsGeneratingCoverLetter(true);
    try {
      const response = await fetch('http://160.250.246.119:4000/api/ai/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: displayTitle,
          companyName: displayCompanyName,
          candidateName: fullName.trim(),
          desiredJob: userData?.desiredJob || '',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Không thể kết nối đến máy chủ AI';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          if (response.status === 404) {
            errorMessage = 'Đường dẫn tạo thư giới thiệu không tồn tại trên máy chủ (404). Vui lòng cập nhật API backend.';
          } else {
            errorMessage = `Lỗi máy chủ (${response.status}): ${errorText.substring(0, 100)}`;
          }
        }
        throw new Error(errorMessage);
      }

      const resText = await response.text();
      let data: any;
      try {
        data = JSON.parse(resText);
      } catch (e) {
        throw new Error('Phản hồi từ máy chủ không đúng định dạng JSON.');
      }

      if (data.success && data.coverLetter) {
        setMessage(data.coverLetter);
        Alert.alert('Thành công', 'AI đã viết thư giới thiệu cho bạn! Bạn có thể chỉnh sửa lại nội dung này.');
      } else {
        throw new Error(data.error || 'Lỗi không xác định từ AI');
      }
    } catch (error: any) {
      console.error('Error generating cover letter:', error);
      Alert.alert('Lỗi', `Không thể tạo thư giới thiệu tự động: ${error.message}`);
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const [isCheckingAIMatch, setIsCheckingAIMatch] = React.useState(false);

  const handleCheckAIMatch = async () => {
    setIsCheckingAIMatch(true);
    try {
      const response = await fetch('http://160.250.246.119:4000/api/ai/candidate-match-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: displayTitle,
          applicantName: fullName.trim() || userData?.fullName || 'Ứng viên',
          candidateSkills: (userData as any)?.skills || [],
          candidateExperience: (userData as any)?.experience || [],
          message,
        }),
      });

      if (!response.ok) throw new Error('Không thể kết nối đến AI.');

      const data = await response.json();
      if (data.success) {
        Alert.alert(
          `✨ AI Match Score: ${data.matchScore}%`,
          `Đánh giá độ phù hợp của bạn với vị trí "${displayTitle}":\n\n"${data.reason || data.matchSummary}"`,
          [{ text: 'Đã hiểu', style: 'default' }]
        );
      } else {
        throw new Error(data.error || 'Lỗi kiểm tra độ phù hợp.');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể kiểm tra độ phù hợp với AI.');
    } finally {
      setIsCheckingAIMatch(false);
    }
  };
  const isAccountVerified = !!userData?.isVerified;
  const userFullName = userData?.fullName;
  const userEmailOrPhone = userData?.emailOrPhone;
  const userPhone = userData?.phone;
  const userCvName = userData?.cvName;
  const userCvSize = userData?.cvSize;
  const userCvUploadTime = userData?.cvUploadTime;

  const handleUploadCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const fileSizeInMB = asset.size ? (asset.size / (1024 * 1024)).toFixed(1) + ' MB' : 'Đang cập nhật';
      const newFile = {
        name: asset.name,
        size: fileSizeInMB,
        uploadTime: 'Vừa xong',
        url: asset.uri,
      };

      // Tải tệp CV lên máy chủ
      try {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            } else {
              reject(new Error('Chuyển đổi base64 thất bại'));
            }
          };
          reader.readAsDataURL(blob);
        });

        const uploadResponse = await fetch('http://160.250.246.119:4000/api/upload-cv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: asset.name, base64Data })
        });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          newFile.url = data.url;
        }
      } catch (error) {
        console.warn('Lỗi khi tải file CV lên máy chủ:', error);
      }

      setCvFile(newFile);
      setCvUploaded(true);
      Alert.alert('Thành công', `Đã chọn tệp CV "${asset.name}" thành công!`);
    } catch (err) {
      console.error('Lỗi khi chọn file:', err);
      Alert.alert('Lỗi', 'Không thể chọn tệp lúc này.');
    }
  };

  React.useEffect(() => {
    if (userFullName || userEmailOrPhone || userPhone || userCvName) {
      if (userFullName) {
        setFullName(userFullName);
      }
      if (userPhone) {
        setPhoneNumber(userPhone);
      }
      if (userEmailOrPhone?.includes('@')) {
        setEmail(userEmailOrPhone);
      } else if (userEmailOrPhone && !userPhone) {
        setPhoneNumber(userEmailOrPhone);
      }
      if (userCvName) {
        setCvFile({
          name: userCvName,
          size: userCvSize || 'Đang cập nhật',
          uploadTime: userCvUploadTime || 'Vừa xong',
          url: userData?.cvUrl,
        });
        setCvUploaded(true);
      }
    }
  }, [userCvName, userCvSize, userCvUploadTime, userEmailOrPhone, userFullName, userPhone, userData?.cvUrl]);

  React.useEffect(() => {
    if (isInitializing || hasShownVerificationAlert.current) {
      return;
    }

    if (!isLoggedIn) {
      hasShownVerificationAlert.current = true;
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để ứng tuyển công việc.', [
        { text: 'Đăng nhập', onPress: () => router.replace('/login') },
      ]);
      return;
    }

    if (!isAccountVerified) {
      hasShownVerificationAlert.current = true;
      Alert.alert(
        'Cần xác minh tài khoản',
        'Bạn cần xác minh tài khoản trước khi gửi hồ sơ ứng tuyển.',
        [
          { text: 'Xác minh ngay', onPress: () => router.replace('/(tabs)/profile') },
        ]
      );
    }
  }, [isAccountVerified, isInitializing, isLoggedIn, router]);

  const handleSubmit = async () => {
    if (!isAccountVerified) {
      Alert.alert('Cần xác minh tài khoản', 'Vui lòng xác minh tài khoản trước khi ứng tuyển.', [
        { text: 'Xác minh ngay', onPress: () => router.replace('/(tabs)/profile') },
      ]);
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!cvUploaded || !cvFile) {
      Alert.alert('Thông báo', 'Vui lòng tải lên CV hoặc Hồ sơ năng lực của bạn.');
      return;
    }

    const result = await submitApplication({
      jobId,
      jobTitle: displayTitle,
      companyName: displayCompanyName,
      jobSalary: displaySalary,
      jobLocation: displayLocation,
      applicantName: fullName.trim(),
      applicantPhone: phoneNumber.trim() || 'Liên hệ qua Email (Chưa có SĐT)',
      applicantEmail: email.trim(),
      message: message.trim(),
      cvName: cvFile.name,
      cvSize: cvFile.size,
      cvUploadTime: cvFile.uploadTime,
      cvUrl: cvFile.url,
    });

    if (!result.success) {
      Alert.alert('Thông báo', result.message);
      return;
    }

    Alert.alert(
      'Thành công',
      result.message,
      [
        {
          text: 'Xem trong trang cá nhân',
          onPress: () => router.replace('/(tabs)/profile'),
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
                  <Text style={styles.locationText}>{displayLocation}</Text>
                </View>
              </View>
            </View>

            {/* Expected Salary Banner */}
            <View style={[styles.salaryBanner, { backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}>
              <Text style={[styles.salaryLabel, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                Mức lương dự kiến
              </Text>
              <Text style={styles.salaryValue}>{displaySalary}</Text>
            </View>
          </View>

          {/* Personal Information Form Card */}
          <View style={[styles.whiteCard, styles.formCard, isDark && styles.darkCard]}>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderText}>
                <Text style={[styles.formTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Thông tin ứng tuyển</Text>
                <Text style={styles.formSubtitle}>Thông tin được lấy từ tài khoản đã xác minh của bạn</Text>
              </View>
              <View style={[styles.verifiedPill, { backgroundColor: isDark ? '#153322' : '#E8F5E9' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#2E7D32" />
                <Text style={styles.verifiedPillText}>Đã xác minh</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#ECEDEE' : '#333' }]}>
                Họ và tên <Text style={styles.star}>*</Text>
              </Text>
              <View style={[
                styles.inputShell,
                {
                  borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                  backgroundColor: isDark ? '#151718' : '#F8FAFC',
                },
              ]}>
                <Ionicons name="person-outline" size={18} color="#0084FF" style={styles.inputIcon} />
                <TextInput
                style={[
                  styles.textInput,
                  {
                    color: isDark ? '#FFF' : '#11181C',
                  },
                ]}
                placeholder="Nhập họ và tên của bạn"
                placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                value={fullName}
                onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#ECEDEE' : '#333' }]}>
                Số điện thoại <Text style={styles.star}>*</Text>
              </Text>
              <View style={[
                styles.inputShell,
                {
                  borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                  backgroundColor: isDark ? '#151718' : '#F8FAFC',
                },
              ]}>
                <Ionicons name="call-outline" size={18} color="#0084FF" style={styles.inputIcon} />
                <TextInput
                style={[
                  styles.textInput,
                  {
                    color: isDark ? '#FFF' : '#11181C',
                  },
                ]}
                placeholder="Ví dụ: 0912345678"
                placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#ECEDEE' : '#333' }]}>
                Email (Không bắt buộc)
              </Text>
              <View style={[
                styles.inputShell,
                {
                  borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                  backgroundColor: isDark ? '#151718' : '#F8FAFC',
                },
              ]}>
                <Ionicons name="mail-outline" size={18} color="#0084FF" style={styles.inputIcon} />
                <TextInput
                style={[
                  styles.textInput,
                  {
                    color: isDark ? '#FFF' : '#11181C',
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
            </View>

            {/* Cover Message */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.inputLabel, { color: isDark ? '#ECEDEE' : '#333', marginBottom: 0 }]}>
                  Thư giới thiệu
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleCheckAIMatch}
                    disabled={isCheckingAIMatch}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#7C3AED',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      gap: 4
                    }}
                  >
                    {isCheckingAIMatch ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={12} color="#FFF" />
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '600' }}>AI Match %</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={handleGenerateAICoverLetter}
                    disabled={isGeneratingCoverLetter}
                    style={[
                      styles.aiButton,
                      {
                        backgroundColor: isDark ? '#1F2937' : '#F0F7FF',
                        borderColor: '#0084FF',
                      }
                    ]}
                  >
                    {isGeneratingCoverLetter ? (
                      <ActivityIndicator size="small" color="#0084FF" />
                    ) : (
                      <>
                        <Ionicons name="sparkles" size={12} color="#0084FF" />
                        <Text style={styles.aiButtonText}>AI viết hộ</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[
                styles.textAreaShell,
                {
                  borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                  backgroundColor: isDark ? '#151718' : '#F8FAFC',
                },
              ]}>
                <Ionicons name="create-outline" size={18} color="#0084FF" style={styles.textAreaIcon} />
                <TextInput
                style={[
                  styles.textAreaInput,
                  {
                    color: isDark ? '#FFF' : '#11181C',
                  },
                ]}
                placeholder="Giới thiệu ngắn gọn về kinh nghiệm hoặc lý do bạn phù hợp với công việc này..."
                placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
                />
              </View>
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
                <Text style={[styles.uploadTextBold, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                  {cvUploaded && cvFile ? cvFile.name : 'Nhấn để chọn file hoặc ảnh'}
                </Text>
                <Text style={styles.uploadTextSub}>
                  {cvUploaded && cvFile ? `Dung lượng: ${cvFile.size} • Bấm để thay đổi` : 'Hỗ trợ định dạng: PDF, DOCX, JPG, PNG'}
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
    padding: 18,
  },
  formHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  formHeaderText: {
    width: '100%',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 4,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  verifiedPillText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
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
  inputShell: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  textAreaShell: {
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 118,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textAreaIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  textAreaInput: {
    flex: 1,
    minHeight: 92,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    paddingTop: 0,
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
    borderRadius: 16,
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
    borderRadius: 14,
    height: 52,
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
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  aiButtonText: {
    fontSize: 11,
    color: '#0084FF',
    fontWeight: '700',
  },
  scrollPaddingBottom: {
    height: 30,
  },
});
