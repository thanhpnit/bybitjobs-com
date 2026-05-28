import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const {
    isLoggedIn,
    logout,
    userData,
    userRole,
    employerData,
    registerEmployer,
    verifyAccount
  } = useAuth();

  // Job seeking switch states
  const [isJobSeeking, setIsJobSeeking] = React.useState(true);
  const [allowEmployerSearch, setAllowEmployerSearch] = React.useState(true);

  // 2-Step Verification state
  const [is2FAEnabled, setIs2FAEnabled] = React.useState(false);

  // 2-Step Verification Flow States
  const [is2FAModalVisible, setIs2FAModalVisible] = React.useState(false);
  const [twoFAStep, setTwoFAStep] = React.useState<'intro' | 'otp' | 'enabled_info'>('intro');
  const [twoFACode, setTwoFACode] = React.useState('');
  const [twoFATimer, setTwoFATimer] = React.useState(150); // 2 minutes 30 seconds

  // Countdown timer for 2FA OTP
  React.useEffect(() => {
    let interval: any = null;
    if (is2FAModalVisible && twoFAStep === 'otp' && twoFATimer > 0) {
      interval = setInterval(() => {
        setTwoFATimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [is2FAModalVisible, twoFAStep, twoFATimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResend2FACode = () => {
    setTwoFATimer(150);
    Alert.alert('Thành công', 'Một mã xác minh mới đã được gửi tới email của bạn.');
  };

  const handleConfirm2FAOTP = () => {
    if (twoFACode.trim().length === 6) {
      verifyAccount(); // Automatically grant verification (blue tick)
      setIs2FAEnabled(true);
      setTwoFAStep('enabled_info');
      Alert.alert(
        'Thành công',
        'Tính năng xác minh 2 bước đã được kích hoạt thành công. Hồ sơ của bạn đã được xác thực uy tín với dấu tích xanh!'
      );
      setIs2FAModalVisible(false);
    } else {
      Alert.alert('Lỗi xác thực', 'Vui lòng nhập đúng mã xác minh 6 ký tự.');
    }
  };

  const handleDisable2FA = () => {
    Alert.alert(
      'Vô hiệu hóa xác minh 2 bước',
      'Bạn có chắc chắn muốn tắt tính năng xác minh 2 bước? Bảo mật tài khoản của bạn sẽ bị giảm đi.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Vô hiệu hóa',
          style: 'destructive',
          onPress: () => {
            setIs2FAEnabled(false);
            setIs2FAModalVisible(false);
            Alert.alert('Thông báo', 'Đã tắt tính năng xác minh 2 bước.');
          }
        }
      ]
    );
  };

  // CV / Cover Letter states
  interface CVInfo {
    fileName: string;
    fileSize: string;
    uploadTime: string;
  }
  const [cvFile, setCvFile] = React.useState<CVInfo | null>(null);
  const [coverLetterFile, setCoverLetterFile] = React.useState<CVInfo | null>(null);

  // Active selected tab inside My CV section ('cv' | 'coverLetter')
  const [activeCvTab, setActiveCvTab] = React.useState<'cv' | 'coverLetter'>('cv');

  // File explorer states
  const [isFileExplorerVisible, setIsFileExplorerVisible] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = React.useState<number | null>(null);
  const [activeUploadType, setActiveUploadType] = React.useState<'cv' | 'coverLetter'>('cv');

  // Verification code states
  const [isVerificationVisible, setIsVerificationVisible] = React.useState(false);
  const [verificationCode, setVerificationCode] = React.useState('');

  // Sync mock CV only for the default pre-existing developer account
  React.useEffect(() => {
    if (userData) {
      if (userData.emailOrPhone === 'quan.nguyen@example.com') {
        setCvFile({
          fileName: 'CV_NguyenMinhQuan_Senior_Web.pdf',
          fileSize: '1.2MB',
          uploadTime: '2 ngày trước',
        });
      } else {
        setCvFile(null); // Newly registered user will start with no CV
      }
    } else {
      setCvFile(null);
    }
  }, [userData]);

  const mockFiles = [
    { name: 'CV_Web_Developer_VN.pdf', size: '1.1 MB', path: 'Documents/CVs/' },
    { name: 'CV_Frontend_Senior_En.pdf', size: '1.4 MB', path: 'Documents/CVs/' },
    { name: 'CV_Design_Portfolio.pdf', size: '3.8 MB', path: 'Downloads/' },
    { name: 'CV_Product_Manager_2026.pdf', size: '2.1 MB', path: 'Documents/' },
  ];

  const handleUploadCV = () => {
    if (selectedFileIndex === null) {
      Alert.alert('Thông báo', 'Vui lòng chọn một tệp từ danh sách.');
      return;
    }

    setIsFileExplorerVisible(false);
    setIsUploading(true);

    // Simulate uploading for 1.2 seconds
    setTimeout(() => {
      const selected = mockFiles[selectedFileIndex];
      const newFile = {
        fileName: selected.name,
        fileSize: selected.size,
        uploadTime: 'Vừa xong',
      };

      if (activeUploadType === 'cv') {
        setCvFile(newFile);
      } else {
        setCoverLetterFile(newFile);
      }

      setIsUploading(false);
      setSelectedFileIndex(null);
      Alert.alert('Thành công', `Tải lên tài liệu ${activeUploadType === 'cv' ? 'CV' : 'Cover Letter'} thành công!`);
    }, 1200);
  };

  const handleSendVerificationEmail = () => {
    Alert.alert(
      'Gửi mã xác thực',
      `Mã xác thực gồm 6 chữ số đã được gửi tới email ${userEmail}. Bạn có muốn nhập mã để xác thực tài khoản ngay không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Nhập mã',
          onPress: () => {
            setIsVerificationVisible(true);
          }
        }
      ]
    );
  };

  const handleVerifySubmit = () => {
    if (verificationCode.trim() === '123456' || verificationCode.trim().length === 6) {
      verifyAccount();
      setIsVerificationVisible(false);
      setVerificationCode('');
      Alert.alert('Thành công', 'Tài khoản của bạn đã được xác thực thành công! Dấu tích xanh uy tín đã được cấp.');
    } else {
      Alert.alert('Lỗi xác thực', 'Mã xác thực không đúng. Vui lòng nhập lại (Mã mẫu là 123456).');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: logout }
      ]
    );
  };

  const displayName = isLoggedIn ? (userData?.fullName || 'Nguyễn Minh Quân') : 'Tài khoản khách';

  const getInitial = (name: string) => {
    if (!name) return 'Q';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return 'Q';
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase();
  };

  const initialLetter = isLoggedIn ? getInitial(displayName) : 'G';

  // Dynamically assign registered account info
  const userEmail = isLoggedIn
    ? (userData?.emailOrPhone && userData.emailOrPhone.includes('@')
      ? userData.emailOrPhone
      : 'quan.nguyen@example.com')
    : 'Chưa liên kết';

  const userPhone = isLoggedIn
    ? (userData?.emailOrPhone && !userData.emailOrPhone.includes('@')
      ? userData.emailOrPhone
      : '090 1234 567')
    : 'Chưa liên kết';

  // Dynamic dates
  const creationDate = isLoggedIn
    ? (userData?.emailOrPhone ? 'Đăng ký hôm nay' : '15/10/2023')
    : 'Chưa đăng ký';
  const lastLogin = isLoggedIn
    ? (userData?.emailOrPhone ? 'Vừa xong' : '24/05/2024 - 14:30')
    : 'Chưa đăng nhập';

  const handleFeaturePress = (featureName: string, action: () => void) => {
    if (!isLoggedIn) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        `Vui lòng đăng nhập để sử dụng tính năng "${featureName}".`,
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => router.push('/login') }
        ]
      );
    } else {
      action();
    }
  };

  const triggerFeatureMock = (featureName: string) => {
    Alert.alert('Thông báo', `Chức năng "${featureName}" đang được chuẩn bị cập nhật trong phiên bản tiếp theo.`);
  };

  const handlePreviewCV = () => {
    Alert.alert('Xem trước tài liệu', 'Đang mở trình duyệt xem trước tệp tài liệu của bạn...');
  };

  // Switch renderer helper
  const renderSwitch = (value: boolean, onValueChange: () => void) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onValueChange}
      style={[
        styles.switchTrack,
        { backgroundColor: value ? '#4CAF50' : (isDark ? '#3A3A3C' : '#E5E5EA') }
      ]}
    >
      <View
        style={[
          styles.switchThumb,
          { alignSelf: value ? 'flex-end' : 'flex-start' }
        ]}
      />
    </TouchableOpacity>
  );

  // Reusable row for settings
  const renderSettingRow = (
    iconName: any,
    title: string,
    onPress: () => void,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.settingRowItem, { borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}
    >
      <View style={styles.settingRowLeft}>
        <View style={[styles.settingRowIconBox, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
          <Ionicons name={iconName} size={18} color="#0084FF" />
        </View>
        <Text style={[styles.settingRowText, { color: isDark ? '#FFF' : '#11181C' }]}>
          {title}
        </Text>
      </View>
      {rightElement ? rightElement : (
        <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#CCC'} />
      )}
    </TouchableOpacity>
  );



  // 2. Full premium TopCV-style profile view when logged in
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      <View style={styles.headerBg} />
      <SafeAreaView style={styles.safeArea}>

        {/* Header Bar with Logout */}
        <View style={styles.headerBar}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
            <Ionicons name="menu-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BybitJobs</Text>
          <View style={styles.headerBarPlaceholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* 1. Header Profile & Avatar Card */}
          <View style={[styles.whiteCard, styles.avatarCard, isDark && styles.darkCard]}>
            <View style={styles.avatarMainSection}>
              {isLoggedIn ? (
                <>
                  <View style={styles.avatarWrapper}>
                    <View
                      style={[
                        styles.avatarImage,
                        {
                          backgroundColor: '#0084FF',
                          borderColor: isDark ? '#3C3C3E' : '#FFF',
                        },
                      ]}
                    >
                      <Text style={styles.avatarInitialText}>{initialLetter}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => triggerFeatureMock('Thay ảnh đại diện')} style={styles.pencilOverlay}>
                      <Ionicons name="camera" size={12} color="#FFF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.avatarInfoCol}>
                    <Text style={[styles.userName, { color: isDark ? '#FFF' : '#11181C' }]}>
                      {displayName}
                    </Text>
                    <Text style={styles.userId}>USER ID: SJ-992834</Text>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => triggerFeatureMock('Nâng cấp tài khoản')}
                      style={styles.upgradeHeaderBtn}
                    >
                      <Ionicons name="star" size={13} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.upgradeHeaderBtnText}>Nâng cấp tài khoản</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/login')} style={styles.avatarWrapper}>
                    <View
                      style={[
                        styles.avatarImage,
                        {
                          backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
                          borderColor: isDark ? '#3C3C3E' : '#FFF',
                        },
                      ]}
                    >
                      <Ionicons name="person" size={38} color={isDark ? '#8E8E93' : '#AEAEB2'} />
                    </View>
                    <View style={[styles.pencilOverlay, { backgroundColor: '#0084FF' }]}>
                      <Ionicons name="log-in" size={12} color="#FFF" />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.avatarInfoCol}>
                    <Text style={[styles.userName, { color: isDark ? '#FFF' : '#11181C' }]}>
                      Chào bạn!
                    </Text>
                    <Text style={styles.userId}>Đăng nhập để lưu hồ sơ & ứng tuyển</Text>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => router.push('/login')}
                      style={[styles.upgradeHeaderBtn, { backgroundColor: '#0084FF', shadowColor: '#0084FF' }]}
                    >
                      <Ionicons name="log-in-outline" size={13} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.upgradeHeaderBtnText}>Đăng nhập ngay</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* 2. Job Seeking Switches (Trạng thái tìm việc & Cho phép NTD tìm kiếm hồ sơ) - Chỉ hiển thị khi đã đăng nhập */}
          {isLoggedIn && (
            <View style={[styles.whiteCard, isDark && styles.darkCard]}>
              <View style={styles.switchRowItem}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.switchTitleText, { color: isDark ? '#FFF' : '#11181C' }]}>
                    Trạng thái tìm việc
                  </Text>
                  <Text style={styles.switchDescText}>
                    {isJobSeeking ? 'Đang bật tìm kiếm cơ hội việc làm mới' : 'Đang tắt tìm việc'}
                  </Text>
                </View>
                {renderSwitch(isJobSeeking, () => handleFeaturePress('Trạng thái tìm việc', () => setIsJobSeeking(!isJobSeeking)))}
              </View>

              <View style={[styles.dividerLight, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

              <View style={styles.switchRowItem}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.switchTitleText, { color: isDark ? '#FFF' : '#11181C' }]}>
                    Cho phép NTD tìm kiếm hồ sơ
                  </Text>
                  <Text style={styles.switchDescText}>
                    Cho phép nhà tuyển dụng chủ động xem CV và gửi lời mời phỏng vấn
                  </Text>
                </View>
                {renderSwitch(allowEmployerSearch, () => handleFeaturePress('Cho phép NTD tìm kiếm hồ sơ', () => setAllowEmployerSearch(!allowEmployerSearch)))}
              </View>
            </View>
          )}

          {/* 3. Personal Info Card (Thông tin cá nhân & Xác thực) - Chỉ hiển thị khi đã đăng nhập */}
          {isLoggedIn && (
            <View style={[styles.whiteCard, isDark && styles.darkCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="card-outline" size={20} color="#0084FF" style={styles.cardHeaderIcon} />
                <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Thông tin cá nhân
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

              <View style={styles.infoRow}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                  <Ionicons name="mail-outline" size={16} color="#0084FF" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>EMAIL</Text>
                  <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#11181C' }]}>
                    {userEmail}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                  <Ionicons name="call-outline" size={16} color="#0084FF" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>SỐ ĐIỆN THOẠI</Text>
                  <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#11181C' }]}>
                    {userPhone}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                  <Ionicons name="people-outline" size={16} color="#0084FF" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>VAI TRÒ</Text>
                  <Text style={[styles.infoValueActive, { color: userRole === 'employer' ? '#4CAF50' : '#0084FF' }]}>
                    {userRole === 'employer' ? 'Nhà tuyển dụng' : 'Người tìm việc'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                  <Ionicons name={userData?.isVerified ? "checkmark-done-outline" : "alert-circle-outline"} size={16} color={userData?.isVerified ? "#4CAF50" : "#FF9500"} />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>TRẠNG THÁI HỒ SƠ</Text>
                  {userData?.isVerified ? (
                    <View style={styles.verifiedStatusRow}>
                      <Text style={[styles.infoValueVerified, { color: '#4CAF50' }]}>
                        Đã xác thực
                      </Text>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" style={styles.checkIcon} />
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FF9500' }}>
                        Chưa xác thực
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleFeaturePress('Xác thực hồ sơ', handleSendVerificationEmail)}
                        style={{ backgroundColor: '#FF9500', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}
                      >
                        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Xác thực</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Employer Card (Company details displayed dynamically if role is Employer) */}
          {userRole === 'employer' && (
            <View style={[styles.whiteCard, isDark && styles.darkCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="business-outline" size={20} color="#4CAF50" style={styles.cardHeaderIcon} />
                <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Thông tin Doanh nghiệp
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

              <View style={styles.companyInfoItem}>
                <Text style={styles.companyInfoLabel}>TÊN CÔNG TY</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C', marginTop: 2 }}>
                  {employerData?.companyName || 'Công ty Công nghệ Bybit Việt Nam'}
                </Text>
              </View>

              <View style={styles.companyInfoItem}>
                <Text style={styles.companyInfoLabel}>MÃ SỐ THUẾ</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C', marginTop: 2 }}>
                  {employerData?.taxId || '0109283746'}
                </Text>
              </View>

              <View style={styles.companyInfoItem}>
                <Text style={styles.companyInfoLabel}>ĐỊA CHỈ</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C', marginTop: 2 }}>
                  {employerData?.address || 'Tòa nhà Landmark 81, TP. HCM'}
                </Text>
              </View>

              <View style={styles.companyInfoItem}>
                <Text style={styles.companyInfoLabel}>GÓI DỊCH VỤ</Text>
                <View style={styles.packageBadgeRow}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4CAF50', marginTop: 2 }}>
                    {employerData?.servicePackage || 'Free'}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push('/recruiter/pricing')}
                    style={styles.upgradePackageBtn}
                  >
                    <Text style={styles.upgradePackageBtnText}>Nâng cấp</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/recruiter/dashboard')}
                style={{
                  backgroundColor: '#4CAF50',
                  height: 44,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 16,
                  flexDirection: 'row',
                  gap: 6
                }}
              >
                <Ionicons name="desktop-outline" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>Mở Dashboard Tuyển dụng</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Employer Upgrade Promo (Shown if candidate) */}
          {userRole !== 'employer' && (
            <View style={[styles.whiteCard, isDark && styles.darkCard, { borderLeftWidth: 4, borderLeftColor: '#0084FF' }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="business-outline" size={20} color="#0084FF" style={styles.cardHeaderIcon} />
                <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Tuyển dụng trên BybitJobs
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />
              <Text style={{ fontSize: 13, color: isDark ? '#9BA1A6' : '#687076', marginBottom: 16, lineHeight: 18 }}>
                Đăng ký tài khoản nhà tuyển dụng miễn phí để đăng tin tuyển dụng và tìm kiếm nhân tài ngay hôm nay.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleFeaturePress('Đăng ký tuyển dụng', () => {
                  router.push('/recruiter/register');
                })}
                style={styles.upgradeButton}
              >
                <Text style={styles.upgradeButtonText}>Kích hoạt tài khoản Tuyển dụng</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 4. CV của tôi (CV đã tải lên & Cover Letter) Card */}
          <View style={[styles.whiteCard, styles.tabbedCard, isDark && styles.darkCard]}>
            <View style={[styles.cardHeader, { paddingHorizontal: 16, paddingTop: 4 }]}>
              <Ionicons name="document-text-outline" size={20} color="#0084FF" style={styles.cardHeaderIcon} />
              <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                CV của tôi
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1', marginHorizontal: 16 }]} />

            {/* My CV nested tab buttons */}
            <View style={styles.nestedCvTabBar}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveCvTab('cv')}
                style={[styles.nestedCvTabBtn, activeCvTab === 'cv' && styles.nestedCvTabBtnActive]}
              >
                <Text style={[styles.nestedCvTabBtnText, activeCvTab === 'cv' ? styles.nestedCvTabBtnTextActive : (isDark ? styles.nestedCvTabBtnTextDark : styles.nestedCvTabBtnTextInactive)]}>
                  CV đã tải lên
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setActiveCvTab('coverLetter')}
                style={[styles.nestedCvTabBtn, activeCvTab === 'coverLetter' && styles.nestedCvTabBtnActive]}
              >
                <Text style={[styles.nestedCvTabBtnText, activeCvTab === 'coverLetter' ? styles.nestedCvTabBtnTextActive : (isDark ? styles.nestedCvTabBtnTextDark : styles.nestedCvTabBtnTextInactive)]}>
                  Cover Letter
                </Text>
              </TouchableOpacity>
            </View>

            {/* Nested Content Rendering */}
            <View style={{ marginTop: 10 }}>
              {isUploading ? (
                <View style={[styles.dashedBox, { borderColor: '#0084FF', paddingVertical: 32 }]}>
                  <ActivityIndicator size="large" color="#0084FF" />
                  <Text style={{ fontSize: 13, color: isDark ? '#9BA1A6' : '#687076', marginTop: 16, fontWeight: '600' }}>
                    Đang tải tài liệu lên hệ thống...
                  </Text>
                </View>
              ) : activeCvTab === 'cv' ? (
                cvFile ? (
                  <View style={[styles.dashedBox, { borderColor: isDark ? '#2C2C2E' : '#B0BEC5' }]}>
                    <View style={[styles.documentCircle, { backgroundColor: '#FFEBEE' }]}>
                      <Ionicons name="document-text" size={32} color="#D32F2F" />
                    </View>

                    <Text style={[styles.documentTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                      {cvFile.fileName}
                    </Text>
                    <Text style={styles.documentMeta}>
                      Đã tải lên: {cvFile.uploadTime} • {cvFile.fileSize}
                    </Text>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handlePreviewCV}
                        style={styles.previewButton}
                      >
                        <Ionicons name="eye-outline" size={16} color="#0084FF" style={styles.buttonIcon} />
                        <Text style={styles.previewText}>Xem trước</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          setActiveUploadType('cv');
                          setIsFileExplorerVisible(true);
                        }}
                        style={styles.downloadButton}
                      >
                        <Ionicons name="cloud-upload-outline" size={16} color="#FFF" style={styles.buttonIcon} />
                        <Text style={styles.downloadText}>Thay đổi tệp</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Alert.alert(
                          'Xóa CV',
                          'Bạn có chắc muốn xóa tệp CV này khỏi tài khoản?',
                          [
                            { text: 'Hủy', style: 'cancel' },
                            { text: 'Xóa ngay', style: 'destructive', onPress: () => setCvFile(null) }
                          ]
                        );
                      }}
                      style={{ marginTop: 14 }}
                    >
                      <Text style={{ fontSize: 12, color: '#FF3B30', fontWeight: 'bold' }}>Xóa tệp CV hiện tại</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.dashedBox, { borderColor: isDark ? '#2C2C2E' : '#B0BEC5', paddingVertical: 24 }]}>
                    <View style={[styles.documentCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE', marginBottom: 12 }]}>
                      <Ionicons name="cloud-upload" size={32} color="#0084FF" />
                    </View>

                    <Text style={[styles.documentTitle, { color: isDark ? '#FFF' : '#11181C', fontSize: 14 }]} numberOfLines={1}>
                      Bạn chưa tải lên CV nào
                    </Text>
                    <Text style={[styles.documentMeta, { marginBottom: 16 }]}>
                      Tải lên tệp PDF, DOCX tối đa 5MB để ứng tuyển
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleFeaturePress('Tải lên CV', () => {
                        setActiveUploadType('cv');
                        setIsFileExplorerVisible(true);
                      })}
                      style={styles.uploadCVButton}
                    >
                      <Ionicons name="folder-open" size={18} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.uploadCVButtonText}>Chọn tệp từ thư mục</Text>
                    </TouchableOpacity>
                  </View>
                )
              ) : (
                coverLetterFile ? (
                  <View style={[styles.dashedBox, { borderColor: isDark ? '#2C2C2E' : '#B0BEC5' }]}>
                    <View style={[styles.documentCircle, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="reader" size={32} color="#0084FF" />
                    </View>

                    <Text style={[styles.documentTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                      {coverLetterFile.fileName}
                    </Text>
                    <Text style={styles.documentMeta}>
                      Đã tải lên: {coverLetterFile.uploadTime} • {coverLetterFile.fileSize}
                    </Text>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => Alert.alert('Xem trước', 'Hiển thị xem trước tài liệu Cover Letter...')}
                        style={styles.previewButton}
                      >
                        <Ionicons name="eye-outline" size={16} color="#0084FF" style={styles.buttonIcon} />
                        <Text style={styles.previewText}>Xem trước</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleFeaturePress('Thay đổi Cover Letter', () => {
                          setActiveUploadType('coverLetter');
                          setIsFileExplorerVisible(true);
                        })}
                        style={styles.downloadButton}
                      >
                        <Ionicons name="cloud-upload-outline" size={16} color="#FFF" style={styles.buttonIcon} />
                        <Text style={styles.downloadText}>Thay đổi tệp</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        Alert.alert(
                          'Xóa Cover Letter',
                          'Bạn có chắc muốn xóa tệp Cover Letter này khỏi tài khoản?',
                          [
                            { text: 'Hủy', style: 'cancel' },
                            { text: 'Xóa ngay', style: 'destructive', onPress: () => setCoverLetterFile(null) }
                          ]
                        );
                      }}
                      style={{ marginTop: 14 }}
                    >
                      <Text style={{ fontSize: 12, color: '#FF3B30', fontWeight: 'bold' }}>Xóa tệp hiện tại</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.dashedBox, { borderColor: isDark ? '#2C2C2E' : '#B0BEC5', paddingVertical: 24 }]}>
                    <View style={[styles.documentCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE', marginBottom: 12 }]}>
                      <Ionicons name="cloud-upload" size={32} color="#0084FF" />
                    </View>

                    <Text style={[styles.documentTitle, { color: isDark ? '#FFF' : '#11181C', fontSize: 14 }]} numberOfLines={1}>
                      Bạn chưa có Cover Letter nào
                    </Text>
                    <Text style={[styles.documentMeta, { marginBottom: 16 }]}>
                      Tải lên Cover Letter để gây ấn tượng mạnh với NTD
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleFeaturePress('Tải lên Cover Letter', () => {
                        setActiveUploadType('coverLetter');
                        setIsFileExplorerVisible(true);
                      })}
                      style={styles.uploadCVButton}
                    >
                      <Ionicons name="folder-open" size={18} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.uploadCVButtonText}>Tải lên Cover Letter</Text>
                    </TouchableOpacity>
                  </View>
                )
              )}
            </View>
          </View>

          {/* 5. Quản lý tìm việc Section */}
          <View style={[styles.whiteCard, isDark && styles.darkCard, { paddingBottom: 6 }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="briefcase-outline" size={20} color="#0084FF" style={styles.cardHeaderIcon} />
              <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Quản lý tìm việc
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

            {renderSettingRow('checkmark-circle-outline', 'Việc làm đã ứng tuyển', () => handleFeaturePress('Việc làm đã ứng tuyển', () => triggerFeatureMock('Việc làm đã ứng tuyển')))}
            {renderSettingRow('heart-outline', 'Việc làm đã lưu', () => handleFeaturePress('Việc làm đã lưu', () => triggerFeatureMock('Việc làm đã lưu')))}
            {renderSettingRow('sparkles-outline', 'Việc làm phù hợp', () => handleFeaturePress('Việc làm phù hợp', () => triggerFeatureMock('Việc làm phù hợp')))}
            {renderSettingRow('ribbon-outline', 'Công ty đang theo dõi', () => handleFeaturePress('Công ty đang theo dõi', () => triggerFeatureMock('Công ty đang theo dõi')))}
            {renderSettingRow('eye-outline', 'NTD đã xem hồ sơ', () => handleFeaturePress('NTD đã xem hồ sơ', () => triggerFeatureMock('NTD đã xem hồ sơ')))}
            {renderSettingRow('options-outline', 'Cài đặt gợi ý việc làm', () => handleFeaturePress('Cài đặt gợi ý việc làm', () => triggerFeatureMock('Cài đặt gợi ý việc làm')))}
            {renderSettingRow('notifications-outline', 'Thông báo việc làm', () => handleFeaturePress('Thông báo việc làm', () => triggerFeatureMock('Thông báo việc làm')))}
          </View>

          {/* 6. Cài đặt tài khoản Section */}
          <View style={[styles.whiteCard, isDark && styles.darkCard, { paddingBottom: 6 }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-outline" size={20} color="#0084FF" style={styles.cardHeaderIcon} />
              <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Cài đặt tài khoản
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

            {renderSettingRow('ribbon-outline', 'Nâng cấp tài khoản VIP', () => handleFeaturePress('Nâng cấp tài khoản VIP', () => triggerFeatureMock('Nâng cấp VIP')))}
            {renderSettingRow('key-outline', 'Đổi mật khẩu', () => handleFeaturePress('Đổi mật khẩu', () => triggerFeatureMock('Đổi mật khẩu')))}
            {renderSettingRow('shield-checkmark-outline', 'Cài đặt bảo mật', () => handleFeaturePress('Cài đặt bảo mật', () => triggerFeatureMock('Cài đặt bảo mật')))}

            {/* 2-Step Verification with dynamic badge */}
            {renderSettingRow(
              'lock-closed-outline',
              'Xác minh 2 bước',
              () => handleFeaturePress('Xác minh 2 bước', () => {
                if (is2FAEnabled) {
                  setTwoFAStep('enabled_info');
                } else {
                  setTwoFAStep('intro');
                }
                setTwoFACode('');
                setTwoFATimer(150);
                setIs2FAModalVisible(true);
              }),
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.twoFactorBadge, { backgroundColor: is2FAEnabled ? '#E8F5E9' : (isDark ? '#3C2F1E' : '#FFF3E0') }]}>
                  <Text style={[styles.twoFactorBadgeText, { color: is2FAEnabled ? '#4CAF50' : '#FF9500' }]}>
                    {is2FAEnabled ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#CCC'} />
              </View>
            )}

            {renderSettingRow('mail-unread-outline', 'Cài đặt thông báo email', () => handleFeaturePress('Cài đặt thông báo email', () => triggerFeatureMock('Cài đặt thông báo email')))}
            {renderSettingRow('trash-outline', 'Vô hiệu hóa tài khoản', () => handleFeaturePress('Vô hiệu hóa tài khoản', () => triggerFeatureMock('Vô hiệu hóa tài khoản')))}
          </View>

          {/* 7. Chính sách và hỗ trợ Section */}
          <View style={[styles.whiteCard, isDark && styles.darkCard, { paddingBottom: 6 }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="help-circle-outline" size={20} color="#0084FF" style={styles.cardHeaderIcon} />
              <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Chính sách và hỗ trợ
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

            {renderSettingRow('document-text-outline', 'Điều khoản dịch vụ', () => triggerFeatureMock('Điều khoản dịch vụ'))}
            {renderSettingRow('shield-outline', 'Chính sách bảo mật', () => triggerFeatureMock('Chính sách bảo mật'))}
            {renderSettingRow('information-circle-outline', 'Trung tâm trợ giúp', () => triggerFeatureMock('Trung tâm trợ giúp'))}
            {renderSettingRow('chatbox-ellipses-outline', 'Gửi ý kiến phản hồi', () => triggerFeatureMock('Gửi ý kiến phản hồi'))}
            {renderSettingRow('call-outline', 'Liên hệ hỗ trợ 24/7', () => triggerFeatureMock('Liên hệ hỗ trợ'))}
          </View>

          {/* 8. Elegant Bottom Logout Button */}
          {!isLoggedIn ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/login')}
              style={[styles.bigLogoutButton, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE', borderColor: '#0084FF', borderWidth: 1 }]}
            >
              <Ionicons name="log-in" size={20} color="#0084FF" style={{ marginRight: 8 }} />
              <Text style={[styles.bigLogoutButtonText, { color: '#0084FF' }]}>Đăng nhập tài khoản</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogout}
              style={[styles.bigLogoutButton, { backgroundColor: isDark ? '#2C1A1D' : '#FFEBEE' }]}
            >
              <Ionicons name="log-out" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
              <Text style={styles.bigLogoutButtonText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          )}

          <View style={styles.scrollPaddingBottom} />
        </ScrollView>
      </SafeAreaView>

      {/* 9. Premium File Explorer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFileExplorerVisible}
        onRequestClose={() => setIsFileExplorerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.explorerContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>

            <View style={[styles.explorerHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="folder-open" size={22} color="#0084FF" style={{ marginRight: 8 }} />
                <Text style={[styles.explorerTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Chọn tài liệu từ thư mục
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setIsFileExplorerVisible(false);
                  setSelectedFileIndex(null);
                }}
                style={styles.closeExplorerBtn}
              >
                <Ionicons name="close" size={24} color={isDark ? '#AAA' : '#666'} />
              </TouchableOpacity>
            </View>

            <View style={[styles.pathBar, { backgroundColor: isDark ? '#2C2C2E' : '#F0F4F8' }]}>
              <Ionicons name="phone-portrait-outline" size={14} color="#0084FF" />
              <Text style={[styles.pathText, { color: isDark ? '#AAA' : '#5E6E7A' }]}>
                {` Bộ nhớ máy > Tài liệu > ${activeUploadType === 'cv' ? 'CVs' : 'CoverLetters'}`}
              </Text>
            </View>

            <View style={[styles.searchBarWrapper, { borderColor: isDark ? '#2C2C2E' : '#E5E5EA', backgroundColor: isDark ? '#151718' : '#F5F5F5' }]}>
              <Ionicons name="search" size={18} color="#8E8E93" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: '#8E8E93' }}>Tìm kiếm tài liệu của bạn...</Text>
            </View>

            <ScrollView style={styles.fileList} showsVerticalScrollIndicator={false}>
              {mockFiles.map((file, index) => {
                const isSelected = selectedFileIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    onPress={() => setSelectedFileIndex(index)}
                    style={[
                      styles.fileItemRow,
                      {
                        borderColor: isSelected ? '#0084FF' : (isDark ? '#2C2C2E' : '#E5E5EA'),
                        backgroundColor: isSelected
                          ? (isDark ? '#1C2A3A' : '#E6F4FE')
                          : 'transparent'
                      }
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View style={[styles.pdfIconBox, { backgroundColor: '#FFEBEE' }]}>
                        <Ionicons name="document-text" size={24} color="#D32F2F" />
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text
                          style={[
                            styles.fileNameText,
                            { color: isDark ? '#FFF' : '#11181C', fontWeight: isSelected ? 'bold' : '500' }
                          ]}
                          numberOfLines={1}
                        >
                          {file.name}
                        </Text>
                        <Text style={styles.fileSizeText}>
                          {file.path}{file.size}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.checkboxCircle}>
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={isSelected ? "#0084FF" : (isDark ? "#444" : "#CCC")}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[styles.explorerFooter, { borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleUploadCV}
                style={[
                  styles.confirmUploadBtn,
                  { backgroundColor: selectedFileIndex !== null ? '#0084FF' : '#B0BEC5' }
                ]}
                disabled={selectedFileIndex === null}
              >
                <Ionicons name="cloud-upload" size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.confirmUploadBtnText}>Tải lên tệp đã chọn</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* 10. Verification Code Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isVerificationVisible}
        onRequestClose={() => setIsVerificationVisible(false)}
      >
        <View style={styles.modalCenteredOverlay}>
          <View style={[styles.verificationContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={[styles.verificationTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Xác thực tài khoản
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setIsVerificationVisible(false);
                  setVerificationCode('');
                }}
              >
                <Ionicons name="close" size={24} color={isDark ? '#AAA' : '#666'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.verificationSubtitle, { color: isDark ? '#AAA' : '#5E6E7A', lineHeight: 18 }]}>
              Hệ thống đã gửi mã xác thực gồm 6 chữ số tới liên hệ đăng ký của bạn. Nhập mã mẫu <Text style={{ fontWeight: 'bold', color: '#FF9500' }}>123456</Text> để hoàn tất xác minh.
            </Text>

            <View style={[styles.verificationInputWrapper, { borderColor: isDark ? '#2C2C2E' : '#E5E5EA', backgroundColor: isDark ? '#151718' : '#F5F5F5' }]}>
              <TextInput
                style={[styles.verificationTextInput, { color: isDark ? '#FFF' : '#11181C' }]}
                placeholder="Nhập mã 6 chữ số"
                placeholderTextColor={isDark ? '#555' : '#8E8E93'}
                keyboardType="number-pad"
                maxLength={6}
                value={verificationCode}
                onChangeText={setVerificationCode}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleVerifySubmit}
              style={[
                styles.verificationSubmitBtn,
                { backgroundColor: verificationCode.trim().length === 6 ? '#4CAF50' : '#B0BEC5' }
              ]}
              disabled={verificationCode.trim().length !== 6}
            >
              <Text style={styles.verificationSubmitBtnText}>Xác minh tài khoản</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* 11. Multi-step 2-Step Verification Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={is2FAModalVisible}
        onRequestClose={() => {
          if (twoFAStep === 'otp' && !is2FAEnabled) {
            setTwoFAStep('intro');
          } else {
            setIs2FAModalVisible(false);
          }
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#151718' : '#F4F5F7' }}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (twoFAStep === 'otp' && !is2FAEnabled) {
                  setTwoFAStep('intro');
                } else {
                  setIs2FAModalVisible(false);
                }
              }}
              style={styles.modalHeaderBackBtn}
            >
              <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#11181C'} />
            </TouchableOpacity>
            <Text style={[styles.modalHeaderTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
              Xác minh 2 bước
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Modal Body */}
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {twoFAStep === 'intro' && (
              <>
                <View style={styles.twoFAContent}>
                  <View style={styles.twoFAShieldContainer}>
                    {/* Shadow shield in background */}
                    <View style={styles.twoFAShieldBg}>
                      <Ionicons name="shield" size={120} color={isDark ? '#2C2C2E' : '#ECEFF1'} />
                    </View>
                    {/* Primary silver shield in foreground */}
                    <View style={styles.twoFAShieldFg}>
                      <Ionicons name="shield" size={150} color={isDark ? '#3A3D40' : '#CFD8DC'} style={styles.twoFAShieldIconShadow} />
                      <View style={styles.twoFAShieldGearBox}>
                        <Ionicons name="settings" size={54} color={isDark ? '#8E8E93' : '#78909C'} />
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.twoFATitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                    Bật tính năng xác minh 2 bước
                  </Text>
                  <Text style={[styles.twoFASubtitle, { color: isDark ? '#9BA1A6' : '#5E6E7A' }]}>
                    Bảo vệ dữ liệu cá nhân và giữ tài khoản luôn nằm trong tầm kiểm soát của bạn bằng 1 lớp bảo mật nữa.
                  </Text>
                </View>

                <View style={styles.twoFAButtonContainer}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setTwoFAStep('otp');
                      setTwoFACode('');
                      setTwoFATimer(150); // Reset timer to 2:30
                    }}
                    style={[styles.twoFAButton, { backgroundColor: '#0084FF', shadowColor: '#0084FF' }]}
                  >
                    <Text style={styles.twoFAButtonText}>Bật xác minh 2 bước</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {twoFAStep === 'otp' && (
              <>
                <View style={styles.twoFAContent}>
                  <Text style={[styles.twoFATitle, { color: isDark ? '#FFF' : '#11181C', marginTop: 20 }]}>
                    Nhập mã xác minh
                  </Text>
                  <Text style={[styles.twoFASubtitle, { color: isDark ? '#9BA1A6' : '#5E6E7A' }]}>
                    Chúng tôi đã gửi mã xác minh tới{' '}
                    <Text style={{ fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C' }}>
                      {userEmail === 'Chưa liên kết' ? 'lechilinh02410@gmail.com' : userEmail}
                    </Text>
                    . Bạn vui lòng kiểm tra email để lấy mã.
                  </Text>

                  <View style={[styles.twoFAInputWrapper, { borderColor: isDark ? '#2C2C2E' : '#E5E5EA', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                    <TextInput
                      style={[styles.twoFATextInput, { color: isDark ? '#FFF' : '#11181C' }]}
                      placeholder="Nhập mã 6 ký tự"
                      placeholderTextColor={isDark ? '#444' : '#B0BEC5'}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={twoFACode}
                      onChangeText={setTwoFACode}
                    />
                  </View>

                  <Text style={[styles.twoFATimerText, { color: isDark ? '#AAA' : '#687076' }]}>
                    Mã hết hạn sau: <Text style={{ fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C' }}>{formatTimer(twoFATimer)}</Text>
                  </Text>

                  <View style={styles.twoFAResendRow}>
                    <Text style={{ fontSize: 13, color: isDark ? '#8E8E93' : '#687076' }}>
                      Chưa nhận được mã?{' '}
                    </Text>
                    <TouchableOpacity activeOpacity={0.7} onPress={handleResend2FACode}>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0084FF', textDecorationLine: 'underline' }}>
                        Gửi lại mã
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.twoFAButtonContainer}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleConfirm2FAOTP}
                    style={[
                      styles.twoFAButton,
                      {
                        backgroundColor: twoFACode.trim().length === 6 ? '#0084FF' : (isDark ? '#2C2C2E' : '#B0BEC5'),
                        shadowColor: twoFACode.trim().length === 6 ? '#0084FF' : 'transparent',
                      }
                    ]}
                    disabled={twoFACode.trim().length !== 6}
                  >
                    <Text style={styles.twoFAButtonText}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {twoFAStep === 'enabled_info' && (
              <>
                <View style={styles.twoFAContent}>
                  <View style={styles.twoFAShieldContainer}>
                    <View style={styles.twoFAShieldFg}>
                      <Ionicons name="shield-checkmark" size={150} color="#0FB759" style={styles.twoFAShieldIconShadow} />
                    </View>
                  </View>

                  <Text style={[styles.twoFATitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                    Xác minh 2 bước đang hoạt động
                  </Text>
                  <Text style={[styles.twoFASubtitle, { color: isDark ? '#9BA1A6' : '#5E6E7A' }]}>
                    Tài khoản của bạn đang được bảo vệ bằng lớp xác thực bổ sung qua Email. Cám ơn bạn đã nâng cấp bảo mật!
                  </Text>

                  <View style={[styles.twoFAStatusBox, { backgroundColor: isDark ? '#1C2D24' : '#E8F5E9' }]}>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0FB759', textAlign: 'center' }}>
                      TRẠNG THÁI: ĐÃ BẢO VỆ AN TOÀN
                    </Text>
                  </View>
                </View>

                <View style={styles.twoFAButtonContainer}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleDisable2FA}
                    style={[styles.twoFAButton, { backgroundColor: '#FF3B30', shadowColor: '#FF3B30', marginBottom: 12 }]}
                  >
                    <Text style={styles.twoFAButtonText}>Tắt xác minh 2 bước</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIs2FAModalVisible(false)}
                    style={[
                      styles.twoFAButton,
                      {
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderColor: isDark ? '#3C3C3E' : '#E5E5EA',
                        shadowColor: 'transparent',
                        elevation: 0,
                      }
                    ]}
                  >
                    <Text style={[styles.twoFAButtonText, { color: isDark ? '#FFF' : '#11181C' }]}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
    backgroundColor: '#0084FF',
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerBarPlaceholder: {
    width: 36,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  lockedCard: {
    width: '100%',
    maxWidth: 320,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  lockedSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    fontWeight: '500',
  },
  lockedButton: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 24,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  lockedButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Header Avatar styles
  avatarCard: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  avatarMainSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  pencilOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  avatarInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  userId: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 8,
  },
  upgradeHeaderBtn: {
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 26,
    borderRadius: 6,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  upgradeHeaderBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Switches Styles
  switchRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  switchDescText: {
    fontSize: 11,
    color: '#8E8E93',
    lineHeight: 15,
  },
  switchTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  dividerLight: {
    height: 1,
    marginVertical: 4,
  },

  // Cards & Layout elements
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  infoValueActive: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  infoValueVerified: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  verifiedStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  checkIcon: {
    marginLeft: 4,
  },

  // Employer Card Styles
  companyInfoItem: {
    marginBottom: 12,
  },
  companyInfoLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  packageBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  upgradePackageBtn: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upgradePackageBtnText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: 'bold',
  },
  upgradeButton: {
    backgroundColor: '#0084FF',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },

  // My CV nested tabs
  tabbedCard: {
    paddingHorizontal: 0,
  },
  nestedCvTabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 6,
    gap: 12,
  },
  nestedCvTabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  nestedCvTabBtnActive: {
    borderColor: '#0084FF',
    backgroundColor: '#F0F8FF',
  },
  nestedCvTabBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  nestedCvTabBtnTextActive: {
    color: '#0084FF',
  },
  nestedCvTabBtnTextInactive: {
    color: '#687076',
  },
  nestedCvTabBtnTextDark: {
    color: '#9BA1A6',
  },

  dashedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  documentTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  documentMeta: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderWidth: 1.5,
    borderColor: '#0084FF',
    borderRadius: 10,
    height: 38,
  },
  previewText: {
    color: '#0084FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0084FF',
    borderRadius: 10,
    height: 38,
  },
  downloadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 6,
  },
  uploadCVButton: {
    backgroundColor: '#0084FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 18,
    elevation: 3,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  uploadCVButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Settings lists styles
  settingRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingRowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingRowText: {
    fontSize: 13,
    fontWeight: '500',
  },
  twoFactorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  twoFactorBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Policies and Bottom section
  bigLogoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    width: '100%',
    marginTop: 8,
    marginBottom: 20,
  },
  bigLogoutButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollPaddingBottom: {
    height: 60,
  },

  // Modal File Explorer styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  explorerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '65%',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  explorerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  explorerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeExplorerBtn: {
    padding: 4,
  },
  pathBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  pathText: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 12,
  },
  fileList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  fileItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  pdfIconBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileNameText: {
    fontSize: 13,
  },
  fileSizeText: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  checkboxCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  explorerFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  confirmUploadBtn: {
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    elevation: 3,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  confirmUploadBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Modal 2FA styles
  modalCenteredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  verificationContainer: {
    borderRadius: 20,
    width: '90%',
    maxWidth: 320,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  verificationSubtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  verificationInputWrapper: {
    borderWidth: 1.5,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 20,
  },
  verificationTextInput: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 4,
    textAlign: 'center',
    height: '100%',
    width: '100%',
  },
  verificationSubmitBtn: {
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationSubmitBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Modal 2FA Header & Screen Layout Styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  modalHeaderBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  twoFAContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoFAShieldContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  twoFAShieldBg: {
    position: 'absolute',
    right: '30%',
    top: '15%',
    opacity: 0.7,
  },
  twoFAShieldFg: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  twoFAShieldIconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  twoFAShieldGearBox: {
    position: 'absolute',
    top: '32%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  twoFATitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  twoFASubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  twoFAInputWrapper: {
    borderWidth: 1.5,
    borderRadius: 12,
    height: 54,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  twoFATextInput: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    height: '100%',
    width: '100%',
    letterSpacing: 1.5,
  },
  twoFATimerText: {
    fontSize: 13,
    marginBottom: 16,
  },
  twoFAResendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  twoFAButtonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  twoFAButton: {
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#0FB759',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  twoFAButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  twoFAStatusBox: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
});
