import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'expo-router';

function CandidateProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const {
    isLoggedIn,
    logout,
    userData,
    userRole,
    employerData,
    jobs,
    applications,
    savedJobs,
    viewedJobs,
    cancelApplication,
    updateApplicationFeedback,
    toggleSavedJob,
    removeViewedJob,
    registerEmployer,
    verifyAccount,
    seqId,
    updateDesiredJob,
    updateUserPhone,
    sendOtp,
    switchRole
  } = useAuth();

  // Job seeking switch states
  const [isJobSeeking, setIsJobSeeking] = React.useState(true);
  const [allowEmployerSearch, setAllowEmployerSearch] = React.useState(true);

  // 2-Step Verification state
  const [is2FAEnabled, setIs2FAEnabled] = React.useState(false);

  // Edit Job State
  const [isEditJobModalVisible, setIsEditJobModalVisible] = React.useState(false);
  const [editJobInput, setEditJobInput] = React.useState('');

  // Edit Phone State
  const [isEditPhoneModalVisible, setIsEditPhoneModalVisible] = React.useState(false);
  const [editPhoneInput, setEditPhoneInput] = React.useState('');
  const [isAppliedJobsModalVisible, setIsAppliedJobsModalVisible] = React.useState(false);
  const [selectedAppliedJobId, setSelectedAppliedJobId] = React.useState<string | null>(null);
  const [isSavedJobsModalVisible, setIsSavedJobsModalVisible] = React.useState(false);
  const [selectedSavedJobId, setSelectedSavedJobId] = React.useState<string | null>(null);
  const [isViewedJobsModalVisible, setIsViewedJobsModalVisible] = React.useState(false);
  const [selectedViewedJobId, setSelectedViewedJobId] = React.useState<string | null>(null);
  const [companyRating, setCompanyRating] = React.useState(0);
  const [companyComment, setCompanyComment] = React.useState('');

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

  const handleConfirm2FAOTP = async () => {
    if (twoFACode.trim().length === 6) {
      const result = await verifyAccount(twoFACode.trim());
      if (result.success) {
        setIs2FAEnabled(true);
        setTwoFAStep('enabled_info');
        Alert.alert(
          'Thành công',
          'Tính năng xác minh 2 bước đã được kích hoạt thành công. Hồ sơ của bạn đã được xác thực uy tín với dấu tích xanh!'
        );
        setIs2FAModalVisible(false);
      } else {
        Alert.alert('Lỗi xác thực', result.message);
      }
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

  const handleSendVerificationEmail = async () => {
    const result = await sendOtp();
    if (result.success) {
      Alert.alert(
        'Gửi mã xác thực',
        `Mã xác thực gồm 6 chữ số đã được gửi tới email ${userEmail}. Vui lòng kiểm tra hộp thư.`,
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
    } else {
      Alert.alert('Lỗi', result.message);
    }
  };

  const handleVerifySubmit = async () => {
    if (verificationCode.trim().length === 6) {
      const result = await verifyAccount(verificationCode.trim());
      if (result.success) {
        setIsVerificationVisible(false);
        setVerificationCode('');
        Alert.alert('Thành công', 'Tài khoản của bạn đã được xác thực thành công! Dấu tích xanh uy tín đã được cấp.');
      } else {
        Alert.alert('Lỗi xác thực', result.message);
      }
    } else {
      Alert.alert('Lỗi xác thực', 'Mã xác thực không hợp lệ. Vui lòng nhập đúng 6 chữ số.');
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

  const handleEditJob = () => {
    setEditJobInput(userData?.desiredJob || 'Ứng viên (Mobile App)');
    setIsEditJobModalVisible(true);
  };

  const handleSaveJob = async () => {
    if (editJobInput.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập công việc mong muốn');
      return;
    }
    if (updateDesiredJob) {
      await updateDesiredJob(editJobInput.trim());
      setIsEditJobModalVisible(false);
      Alert.alert('Thành công', 'Cập nhật công việc mong muốn thành công!');
    }
  };

  const handleEditPhone = () => {
    setEditPhoneInput(userPhone === 'Chưa cập nhật' ? '' : userPhone);
    setIsEditPhoneModalVisible(true);
  };

  const handleSavePhone = async () => {
    if (editPhoneInput.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    }
    if (updateUserPhone) {
      try {
        await updateUserPhone(editPhoneInput.trim());
        setIsEditPhoneModalVisible(false);
        Alert.alert('Thành công', 'Cập nhật số điện thoại thành công!');
      } catch (err) {
        Alert.alert('Lỗi', 'Không thể cập nhật số điện thoại lúc này.');
      }
    }
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
      : (userData?.phone || 'Chưa cập nhật'))
    : 'Chưa liên kết';

  const appliedJobs = React.useMemo(() => {
    if (!userData?.uid) return [];
    return applications
      .filter((application) => application.candidateId === userData.uid)
      .map((application) => {
        const matchedJob = jobs.find((job) => job.id === application.jobId);
        return {
          ...application,
          title: application.jobTitle || matchedJob?.title || 'Công việc đã ứng tuyển',
          company: application.companyName || 'Nhà tuyển dụng',
          salary: application.jobSalary || matchedJob?.salary || 'Đang cập nhật',
          location: application.jobLocation || matchedJob?.location || 'Đang cập nhật',
        };
      });
  }, [applications, jobs, userData?.uid]);

  const selectedAppliedJob = React.useMemo(() => {
    return appliedJobs.find((application) => application.id === selectedAppliedJobId) || null;
  }, [appliedJobs, selectedAppliedJobId]);

  const savedJobDetails = React.useMemo(() => {
    if (!userData?.uid) return [];
    return savedJobs
      .filter((savedJob) => savedJob.userId === userData.uid)
      .map((savedJob) => {
        const matchedJob = jobs.find((job) => job.id === savedJob.jobId);
        return {
          ...savedJob,
          title: savedJob.jobTitle || matchedJob?.title || 'Công việc đã lưu',
          salary: savedJob.jobSalary || matchedJob?.salary || 'Đang cập nhật',
          location: savedJob.jobLocation || matchedJob?.location || 'Đang cập nhật',
          isOpen: matchedJob?.isOpen,
          deadline: matchedJob?.deadline,
        };
      });
  }, [jobs, savedJobs, userData?.uid]);

  const selectedSavedJob = React.useMemo(() => {
    return savedJobDetails.find((savedJob) => savedJob.id === selectedSavedJobId) || null;
  }, [savedJobDetails, selectedSavedJobId]);

  const viewedJobDetails = React.useMemo(() => {
    if (!userData?.uid) return [];
    return viewedJobs
      .filter((viewedJob) => viewedJob.userId === userData.uid)
      .map((viewedJob) => {
        const matchedJob = jobs.find((job) => job.id === viewedJob.jobId);
        return {
          ...viewedJob,
          title: viewedJob.jobTitle || matchedJob?.title || 'Công việc đã xem',
          salary: viewedJob.jobSalary || matchedJob?.salary || 'Đang cập nhật',
          location: viewedJob.jobLocation || matchedJob?.location || 'Đang cập nhật',
          isOpen: matchedJob?.isOpen,
          deadline: matchedJob?.deadline,
        };
      });
  }, [jobs, userData?.uid, viewedJobs]);

  const selectedViewedJob = React.useMemo(() => {
    return viewedJobDetails.find((viewedJob) => viewedJob.id === selectedViewedJobId) || null;
  }, [selectedViewedJobId, viewedJobDetails]);

  const formatAppliedDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Vừa ứng tuyển';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getApplicationStatusLabel = (status: 'Pending' | 'Approved' | 'Rejected') => {
    if (status === 'Approved') return 'Đã duyệt';
    if (status === 'Rejected') return 'Từ chối';
    return 'Đang chờ';
  };

  const getApplicationStatusColor = (status: 'Pending' | 'Approved' | 'Rejected') => {
    if (status === 'Approved') return '#4CAF50';
    if (status === 'Rejected') return '#FF3B30';
    return '#FF9500';
  };

  const getReviewStatusLabel = (status?: string, hasReview = false) => {
    if (status === 'Đã phê duyệt') return 'Đã phê duyệt';
    if (status === 'Bị báo cáo') return 'Bị báo cáo';
    if (status === 'Chờ duyệt' || hasReview) return 'Chờ duyệt';
    return 'Chưa đánh giá';
  };

  const getReviewStatusColor = (status?: string, hasReview = false) => {
    if (status === 'Đã phê duyệt') return '#4CAF50';
    if (status === 'Bị báo cáo') return '#FF3B30';
    if (status === 'Chờ duyệt' || hasReview) return '#FF9500';
    return '#8E8E93';
  };

  const handleOpenAppliedJobDetail = (applicationId: string) => {
    const application = appliedJobs.find((item) => item.id === applicationId);
    setCompanyRating(application?.companyRating || 0);
    setCompanyComment(application?.companyComment || '');
    setSelectedAppliedJobId(applicationId);
  };

  const handleCloseAppliedJobsModal = () => {
    setIsAppliedJobsModalVisible(false);
    setSelectedAppliedJobId(null);
    setCompanyRating(0);
    setCompanyComment('');
  };

  const handleOpenSavedJobDetail = (savedJobId: string) => {
    setSelectedSavedJobId(savedJobId);
  };

  const handleCloseSavedJobsModal = () => {
    setIsSavedJobsModalVisible(false);
    setSelectedSavedJobId(null);
  };

  const handleViewSavedJob = () => {
    if (!selectedSavedJob) return;
    setIsSavedJobsModalVisible(false);
    setSelectedSavedJobId(null);
    router.push({
      pathname: '/job-details',
      params: {
        jobId: selectedSavedJob.jobId,
        title: selectedSavedJob.title,
        salary: selectedSavedJob.salary,
        location: selectedSavedJob.location,
      },
    });
  };

  const formatSavedDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Vừa lưu';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleRemoveSavedJob = () => {
    if (!selectedSavedJob) return;
    Alert.alert(
      'Bỏ lưu công việc',
      `Bạn có chắc muốn bỏ lưu công việc "${selectedSavedJob.title}" không?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Bỏ lưu',
          style: 'destructive',
          onPress: async () => {
            const result = await toggleSavedJob({
              jobId: selectedSavedJob.jobId,
              jobTitle: selectedSavedJob.title,
              jobSalary: selectedSavedJob.salary,
              jobLocation: selectedSavedJob.location,
            });
            setSelectedSavedJobId(null);
            Alert.alert(result.success ? 'Thành công' : 'Thông báo', result.message);
          },
        },
      ]
    );
  };

  const handleOpenViewedJobDetail = (viewedJobId: string) => {
    setSelectedViewedJobId(viewedJobId);
  };

  const handleCloseViewedJobsModal = () => {
    setIsViewedJobsModalVisible(false);
    setSelectedViewedJobId(null);
  };

  const handleViewViewedJob = () => {
    if (!selectedViewedJob) return;
    setIsViewedJobsModalVisible(false);
    setSelectedViewedJobId(null);
    router.push({
      pathname: '/job-details',
      params: {
        jobId: selectedViewedJob.jobId,
        title: selectedViewedJob.title,
        salary: selectedViewedJob.salary,
        location: selectedViewedJob.location,
      },
    });
  };

  const handleRemoveViewedJob = () => {
    if (!selectedViewedJob) return;
    Alert.alert(
      'Xóa khỏi việc làm đã xem',
      `Bạn có chắc muốn xóa công việc "${selectedViewedJob.title}" khỏi lịch sử xem không?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const result = await removeViewedJob(selectedViewedJob.id);
            setSelectedViewedJobId(null);
            Alert.alert(result.success ? 'Thành công' : 'Thông báo', result.message);
          },
        },
      ]
    );
  };

  const handleCancelApplication = () => {
    if (!selectedAppliedJob) return;
    Alert.alert(
      'Hủy ứng tuyển',
      `Bạn có chắc muốn hủy ứng tuyển công việc "${selectedAppliedJob.title}" không?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy ứng tuyển',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelApplication(selectedAppliedJob.id);
            setSelectedAppliedJobId(null);
            Alert.alert(result.success ? 'Thành công' : 'Thông báo', result.message);
          },
        },
      ]
    );
  };

  const handleSaveCompanyReview = async () => {
    if (!selectedAppliedJob) return;
    if (companyRating < 1) {
      Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá từ 1 đến 5.');
      return;
    }

    const result = await updateApplicationFeedback(selectedAppliedJob.id, {
      companyRating,
      companyComment: companyComment.trim(),
    });
    if (result.success) {
      Alert.alert('Thành công', 'Bạn đã đánh giá thành công.', [
        {
          text: 'Đóng',
          onPress: () => {
            setSelectedAppliedJobId(null);
            setCompanyRating(0);
            setCompanyComment('');
          },
        },
      ]);
      return;
    }
    Alert.alert('Thông báo', result.message);
  };

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

  const renderEmployerProfile = () => {
    const employerJobs = jobs.filter(job => job.employerId === userData?.uid);
    
    // Stats calculation
    const totalJobsCount = employerJobs.length > 0 ? employerJobs.length : 12;
    const activeJobsCount = employerJobs.length > 0 ? employerJobs.filter(j => j.isOpen).length : 8;
    
    let realApplicantsCount = 0;
    employerJobs.forEach(job => {
      realApplicantsCount += job.applicantsCount || 0;
    });
    const totalApplicants = employerJobs.length > 0 ? `${realApplicantsCount}+` : '150+';

    // Fallback jobs list if empty
    const displayJobs = employerJobs.length > 0 ? employerJobs.map(job => ({
      id: job.id,
      title: job.title,
      isOpen: job.isOpen,
      type: job.type || 'Toàn thời gian',
      requiredCount: job.requiredCount || 1,
      applicantsCount: job.applicantsCount || 0,
      salary: job.salary,
      avatars: [] as string[]
    })) : [
      {
        id: 'mock-1',
        title: 'Nhân viên giao hàng khu vực Quận 7',
        isOpen: true,
        type: 'Toàn thời gian',
        requiredCount: 5,
        applicantsCount: 14,
        salary: '300k/ngày',
        avatars: [
          'https://randomuser.me/api/portraits/men/32.jpg',
          'https://randomuser.me/api/portraits/women/44.jpg'
        ]
      },
      {
        id: 'mock-2',
        title: 'Nhân viên đóng gói hàng hóa ca tối',
        isOpen: true,
        type: 'Bán thời gian',
        requiredCount: 2,
        applicantsCount: 5,
        salary: '25k/giờ',
        avatars: [
          'https://randomuser.me/api/portraits/men/45.jpg'
        ]
      },
      {
        id: 'mock-3',
        title: 'Cộng tác viên nhập liệu Online',
        isOpen: false,
        type: 'Từ xa',
        requiredCount: 0,
        applicantsCount: 0,
        salary: '50k/đơn',
        avatars: [] as string[]
      }
    ];

    const servicePackages = [
      {
        id: 'basic',
        name: 'Basic Package',
        price: '50.000đ',
        priceNum: 50000,
        duration: '7 ngày',
        tag: 'TRẠNG THÁI: CƠ BẢN',
        features: [
          'Số lượng: 1 bài đăng',
          'Thời hạn: 7 ngày',
          'Tin nổi bật: Không có',
          'Mô tả: Phù hợp cho nhu cầu tuyển dụng nhỏ và vừa.'
        ],
        isPopular: false,
        isVip: false
      },
      {
        id: 'standard',
        name: 'Standard Package',
        price: '200.000đ',
        priceNum: 200000,
        duration: '30 ngày',
        tag: 'TRẠNG THÁI: NÂNG CAO',
        subTag: 'PHỔ BIẾN NHẤT',
        features: [
          'Số lượng: 5 bài đăng',
          'Thời hạn: 30 ngày',
          'Tin nổi bật: Có (Featured)',
          'Mô tả: Tăng tương tác và hiệu quả tuyển dụng.'
        ],
        isPopular: true,
        isVip: false
      },
      {
        id: 'premium',
        name: 'Premium Package',
        price: '500.000đ',
        priceNum: 500000,
        duration: '365 ngày',
        tag: 'ĐẶC QUYỀN VIP',
        subTag: 'KHUYÊN DÙNG',
        features: [
          'Số lượng: Không giới hạn',
          'Thời hạn: 365 ngày',
          'Tin nổi bật: Có (Premium)',
          'Mô tả: Giải pháp tuyển dụng toàn diện và hỗ trợ 24/7.'
        ],
        isPopular: false,
        isVip: true
      }
    ];

    const benefits = [
      {
        icon: 'eye-outline' as const,
        title: 'Tăng lượt tiếp cận',
        desc: 'Bài đăng của bạn tiếp cận nhiều ứng viên tiềm năng hơn gấp 3 lần.',
      },
      {
        icon: 'checkmark-circle-outline' as const,
        title: 'Huy hiệu xác minh',
        desc: 'Tăng độ uy tín với biểu tượng "Nhà tuyển dụng tin cậy".',
      },
      {
        icon: 'flash-outline' as const,
        title: 'Hỗ trợ ưu tiên',
        desc: 'Mọi thắc mắc của bạn sẽ được đội ngũ Smalljobs xử lý ngay lập tức.',
      },
    ];

    const handleBuyPackage = (pkg: typeof servicePackages[0]) => {
      router.push({
        pathname: '/recruiter/payment',
        params: {
          packageId: pkg.id,
          packageName: pkg.name,
          packagePrice: pkg.price,
          packagePriceNum: String(pkg.priceNum),
          packageDuration: pkg.duration,
        },
      });
    };

    const handlePostJob = () => {
      router.push({
        pathname: '/recruiter/edit-job',
        params: { id: 'new' },
      });
    };

    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header Bar */}
          <View style={[styles.headerBar, { borderBottomWidth: 1, borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}>
            <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
              <Ionicons name="menu-outline" size={26} color={isDark ? '#FFF' : '#11181C'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#11181C' }]}>BybitJobs</Text>
            <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={isDark ? '#FFF' : '#11181C'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* 1. Cover & Logo Hero */}
            <View style={styles.empHeroSection}>
              <Image
                source={require('../../assets/images/small_jobs_banner.png')}
                style={styles.empBannerImage}
                resizeMode="cover"
              />
              <View style={[styles.empLogoWrapper, { borderColor: isDark ? '#151718' : '#FFF' }]}>
                <View style={[styles.empLogoCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                  {employerData?.logo ? (
                    <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#0084FF' }}>
                      {getInitial(employerData?.companyName || 'Công ty TNHH Giao Hàng Nhanh')}
                    </Text>
                  ) : (
                    <Ionicons name="business" size={36} color="#0084FF" />
                  )}
                </View>
              </View>
            </View>

            {/* 2. Company Info Details */}
            <View style={styles.empProfileDetails}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
                <Text style={[styles.empCompanyName, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {employerData?.companyName || 'Công ty TNHH Giao Hàng Nhanh'}
                </Text>
                <Ionicons name="checkmark-circle" size={18} color="#0084FF" style={{ marginLeft: 6 }} />
              </View>
              <View style={styles.empLocationRow}>
                <Ionicons name="location-outline" size={14} color="#8E8E93" />
                <Text style={styles.empLocationText}>
                  {employerData?.address || 'Quận 7, TP. Hồ Chí Minh'}
                </Text>
              </View>
            </View>

            {/* 3. Stats Row */}
            <View style={styles.empStatsRow}>
              <View style={[styles.empStatCard, { backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8' }]}>
                <Text style={[styles.empStatValue, { color: '#0084FF' }]}>{totalJobsCount}</Text>
                <Text style={styles.empStatLabel}>Tin đã đăng</Text>
              </View>
              <View style={[styles.empStatCard, { backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8' }]}>
                <Text style={[styles.empStatValue, { color: '#0084FF' }]}>{activeJobsCount}</Text>
                <Text style={styles.empStatLabel}>Đang tuyển</Text>
              </View>
              <View style={[styles.empStatCard, { backgroundColor: isDark ? '#1C1C1E' : '#F0F4F8' }]}>
                <Text style={[styles.empStatValue, { color: '#0084FF' }]}>{totalApplicants}</Text>
                <Text style={styles.empStatLabel}>Ứng viên</Text>
              </View>
            </View>

            {/* 4. Post New Job Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handlePostJob}
              style={styles.empPostJobBtn}
            >
              <Ionicons name="add-circle" size={20} color="#FFF" />
              <Text style={styles.empPostJobBtnText}>Đăng tin tuyển dụng mới</Text>
            </TouchableOpacity>

            {/* 5. Posted Jobs Section */}
            <View style={styles.empSectionHeader}>
              <Text style={[styles.empSectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Việc làm đã đăng</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/jobs')}>
                <Text style={styles.empSeeAllLink}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.empJobsList}>
              {displayJobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  activeOpacity={0.9}
                  onPress={() => {
                    if (job.id.startsWith('mock-')) {
                      Alert.alert('Thông báo', `Chi tiết tin đăng mẫu: ${job.title}`);
                    } else {
                      router.push({
                        pathname: '/job-details',
                        params: {
                          jobId: job.id,
                          title: job.title,
                          salary: job.salary,
                          location: employerData?.address || 'TP. Hồ Chí Minh',
                        },
                      });
                    }
                  }}
                  style={[styles.empJobCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}
                >
                  <View style={styles.empJobHeader}>
                    <Text style={[styles.empJobTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={2}>
                      {job.title}
                    </Text>
                    <View style={[styles.empJobBadge, { backgroundColor: job.isOpen ? '#E8F5E9' : '#ECEFF1' }]}>
                      <Text style={[styles.empJobBadgeText, { color: job.isOpen ? '#2E7D32' : '#8E8E93' }]}>
                        {job.isOpen ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.empJobMetaRow}>
                    <View style={styles.empJobMetaItem}>
                      <Ionicons name="time-outline" size={13} color="#8E8E93" />
                      <Text style={styles.empJobMetaText}>{job.type}</Text>
                    </View>
                    <View style={styles.empJobMetaItem}>
                      <Ionicons name="people-outline" size={13} color="#8E8E93" />
                      <Text style={styles.empJobMetaText}>
                        {job.requiredCount > 0 ? `Cần ${job.requiredCount} người` : 'Đã tuyển đủ'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.empJobFooter}>
                    <View style={styles.empApplicantsRow}>
                      {job.avatars && job.avatars.length > 0 ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {job.avatars.map((url, idx) => (
                            <Image
                              key={idx}
                              source={{ uri: url }}
                              style={[styles.empApplicantAvatar, { marginLeft: idx > 0 ? -10 : 0 }]}
                            />
                          ))}
                          {job.applicantsCount > job.avatars.length && (
                            <Text style={styles.empApplicantsMore}>
                              +{job.applicantsCount - job.avatars.length}
                            </Text>
                          )}
                        </View>
                      ) : (
                        job.applicantsCount > 0 ? (
                          <Text style={{ fontSize: 11, color: '#0084FF', fontWeight: 'bold' }}>
                            {job.applicantsCount} ứng viên đã ứng tuyển
                          </Text>
                        ) : (
                          <Text style={{ fontSize: 11, color: '#8E8E93' }}>Chưa có ứng viên</Text>
                        )
                      )}
                    </View>

                    <View style={[styles.empJobSalaryBox, { backgroundColor: isDark ? '#1C2A3A' : '#EBF5FF' }]}>
                      <Text style={styles.empJobSalaryText}>{job.salary}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* 6. Pricing Packages Section */}
            <Text style={[styles.empSectionTitle, { paddingHorizontal: 16, marginTop: 28, marginBottom: 16, color: isDark ? '#FFF' : '#11181C' }]}>
              Nâng cấp gói dịch vụ
            </Text>

            {servicePackages.map((pkg) => {
              let cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
              let textColor = isDark ? '#FFF' : '#11181C';
              let descColor = isDark ? '#9BA1A6' : '#687076';
              let buttonBg = isDark ? '#2C2C2E' : '#ECEFF1';
              let buttonText = isDark ? '#FFF' : '#11181C';

              if (pkg.isPopular) {
                cardBg = isDark ? '#1A2E44' : '#F0F8FF';
                buttonBg = '#0084FF';
                buttonText = '#FFFFFF';
              } else if (pkg.isVip) {
                cardBg = '#091E35';
                textColor = '#FFFFFF';
                descColor = '#A8C5E5';
                buttonBg = '#FFFFFF';
                buttonText = '#091E35';
              }

              return (
                <View
                  key={pkg.id}
                  style={[
                    styles.empPkgCard,
                    { backgroundColor: cardBg, borderColor: pkg.isPopular ? '#0084FF' : (isDark ? '#2C2C2E' : '#E5E7EB') },
                    pkg.isPopular && styles.empPkgCardPopular
                  ]}
                >
                  <View style={styles.empPkgTagsRow}>
                    <View
                      style={[
                        styles.empPkgTagBubble,
                        {
                          backgroundColor: pkg.isVip
                            ? '#FF9500'
                            : pkg.isPopular
                              ? '#0084FF'
                              : isDark
                                ? '#2C2C2E'
                                : '#ECEFF1',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.empPkgTagText,
                          { color: pkg.isVip || pkg.isPopular ? '#FFF' : (isDark ? '#9BA1A6' : '#5E6E7A') },
                        ]}
                      >
                        {pkg.tag}
                      </Text>
                    </View>

                    {pkg.subTag && (
                      <View style={[styles.empPkgSubTagBubble, { backgroundColor: pkg.isVip ? '#0084FF' : '#FF9800' }]}>
                        <Text style={styles.empPkgSubTagText}>{pkg.subTag}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.empPkgPriceRow}>
                    <Text style={[styles.empPkgName, { color: textColor }]}>{pkg.name}</Text>
                    <Text
                      style={[
                        styles.empPkgPrice,
                        { color: pkg.isPopular ? '#0084FF' : pkg.isVip ? '#FFF' : '#0084FF' },
                      ]}
                    >
                      {pkg.price}
                    </Text>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                    {pkg.features.map((feature, idx) => (
                      <View key={idx} style={styles.empPkgFeatureItem}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={pkg.isVip ? '#82C1F5' : '#4CAF50'}
                          style={styles.empPkgFeatureIcon}
                        />
                        <Text style={[styles.empPkgFeatureText, { color: descColor }]}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleBuyPackage(pkg)}
                    style={[styles.empPkgBuyBtn, { backgroundColor: buttonBg }]}
                  >
                    <Text style={[styles.empPkgBuyBtnText, { color: buttonText }]}>Mua ngay</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* 7. Benefits Section */}
            <Text style={[styles.empSectionTitle, { paddingHorizontal: 16, marginTop: 20, marginBottom: 16, color: isDark ? '#FFF' : '#11181C' }]}>
              Lợi ích khi nâng cấp
            </Text>

            {benefits.map((benefit, idx) => (
              <View
                key={idx}
                style={[
                  styles.empBenefitCard,
                  { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' },
                ]}
              >
                <View style={[styles.empBenefitIconFrame, { backgroundColor: isDark ? '#2C2C2E' : '#E6F4FE' }]}>
                  <Ionicons name={benefit.icon} size={20} color="#0084FF" />
                </View>
                <View style={styles.empBenefitTextCol}>
                  <Text style={[styles.empBenefitCardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                    {benefit.title}
                  </Text>
                  <Text style={[styles.empBenefitCardDesc, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                    {benefit.desc}
                  </Text>
                </View>
              </View>
            ))}

            {/* 8. Elegant Bottom Promo Banner */}
            <View style={styles.empPromoFrame}>
              <Image
                source={require('../../assets/images/small_jobs_banner.png')}
                style={styles.empPromoImage}
                resizeMode="cover"
              />
              <View style={styles.empPromoOverlay}>
                <Text style={styles.empPromoText}>Hàng ngàn doanh nghiệp đã tin dùng</Text>
              </View>
            </View>

            {/* 9. Settings Options & Logout for Employer */}
            <View style={[styles.whiteCard, isDark && styles.darkCard, { marginHorizontal: 16, paddingBottom: 6 }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="settings-outline" size={20} color="#0084FF" style={styles.cardHeaderIcon} />
                <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Cài đặt tài khoản & Hỗ trợ
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

              {renderSettingRow('business-outline', 'Thông tin công ty', () => router.push('/recruiter/profile'))}
              {renderSettingRow('receipt-outline', 'Lịch sử giao dịch', () => router.push('/recruiter/transactions' as any))}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogout}
              style={[styles.bigLogoutButton, { marginHorizontal: 16, backgroundColor: isDark ? '#2C1A1D' : '#FFEBEE' }]}
            >
              <Ionicons name="log-out" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
              <Text style={styles.bigLogoutButtonText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </View>
    );
  };


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
                    <Text style={styles.userId}>
                      USER ID: {isLoggedIn ? seqId : '000000'}
                    </Text>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#11181C', flex: 1 }]} numberOfLines={1}>
                      {userPhone}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleEditPhone}
                      style={{ backgroundColor: '#0084FF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Sửa</Text>
                    </TouchableOpacity>
                  </View>
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
                  <Ionicons name="briefcase-outline" size={16} color="#0084FF" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>CÔNG VIỆC MONG MUỐN</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                    <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#11181C', flex: 1 }]} numberOfLines={1}>
                      {userData?.desiredJob || 'Ứng viên (Mobile App)'}
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleEditJob}
                      style={{ backgroundColor: '#0084FF', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}
                    >
                      <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Sửa</Text>
                    </TouchableOpacity>
                  </View>
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
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: employerData?.status === 'Chờ duyệt' ? '#FF9500' : '#0084FF', marginLeft: 12 }}>
                    [{employerData?.status || 'Chưa rõ'}]
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
                onPress={() => {
                  if (employerData?.status === 'Chờ duyệt') {
                    Alert.alert('Đang chờ duyệt', 'Hồ sơ doanh nghiệp của bạn đang được Admin xét duyệt. Vui lòng quay lại sau nhé!');
                  } else {
                    router.push('/recruiter/profile');
                  }
                }}
                style={{
                  backgroundColor: employerData?.status === 'Chờ duyệt' ? '#FF9500' : '#4CAF50',
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
            employerData ? (
              <View style={[styles.whiteCard, isDark && styles.darkCard, { borderLeftWidth: 4, borderLeftColor: '#4CAF50' }]}>
                <View style={styles.cardHeader}>
                  <Ionicons name="business-outline" size={20} color="#4CAF50" style={styles.cardHeaderIcon} />
                  <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                    Giao diện Nhà tuyển dụng
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />
                <Text style={{ fontSize: 13, color: isDark ? '#9BA1A6' : '#687076', marginBottom: 16, lineHeight: 18 }}>
                  Tài khoản của bạn đã được đăng ký làm Nhà tuyển dụng. Bấm nút dưới để chuyển đổi sang giao diện quản lý tuyển dụng.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    if (employerData?.status === 'Chờ duyệt') {
                      Alert.alert('Đang chờ duyệt', 'Hồ sơ doanh nghiệp của bạn đang được Admin xét duyệt. Vui lòng quay lại sau nhé!');
                    } else {
                      switchRole('employer');
                      router.replace('/');
                    }
                  }}
                  style={[styles.upgradeButton, { backgroundColor: '#4CAF50' }]}
                >
                  <Ionicons name="swap-horizontal-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.upgradeButtonText}>Chuyển sang giao diện Nhà tuyển dụng</Text>
                </TouchableOpacity>
              </View>
            ) : (
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
            )
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

            {renderSettingRow(
              'checkmark-circle-outline',
              'Việc làm đã ứng tuyển',
              () => handleFeaturePress('Việc làm đã ứng tuyển', () => setIsAppliedJobsModalVisible(true)),
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.twoFactorBadge, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                  <Text style={[styles.twoFactorBadgeText, { color: '#0084FF' }]}>{appliedJobs.length}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#CCC'} />
              </View>
            )}
            {renderSettingRow(
              'heart-outline',
              'Việc làm đã lưu',
              () => handleFeaturePress('Việc làm đã lưu', () => setIsSavedJobsModalVisible(true)),
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.twoFactorBadge, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                  <Text style={[styles.twoFactorBadgeText, { color: '#0084FF' }]}>{savedJobDetails.length}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#CCC'} />
              </View>
            )}
            {renderSettingRow(
              'eye-outline',
              'Việc làm đã xem',
              () => handleFeaturePress('Việc làm đã xem', () => setIsViewedJobsModalVisible(true)),
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.twoFactorBadge, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                  <Text style={[styles.twoFactorBadgeText, { color: '#0084FF' }]}>{viewedJobDetails.length}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#555' : '#CCC'} />
              </View>
            )}
            {renderSettingRow('mail-outline', 'Lời mời làm việc', () => handleFeaturePress('Lời mời làm việc', () => triggerFeatureMock('Lời mời làm việc')))}
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

            {renderSettingRow('key-outline', 'Đổi mật khẩu', () => handleFeaturePress('Đổi mật khẩu', () => triggerFeatureMock('Đổi mật khẩu')))}

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

      <Modal
        animationType="slide"
        transparent={true}
        visible={isAppliedJobsModalVisible}
        onRequestClose={handleCloseAppliedJobsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.appliedJobsModalContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={[styles.explorerHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {selectedAppliedJob ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedAppliedJobId(null);
                      setCompanyRating(0);
                      setCompanyComment('');
                    }}
                    style={styles.appliedBackButton}
                  >
                    <Ionicons name="arrow-back" size={22} color={isDark ? '#FFF' : '#11181C'} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="checkmark-circle-outline" size={22} color="#0084FF" style={{ marginRight: 8 }} />
                )}
                <Text style={[styles.explorerTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {selectedAppliedJob ? 'Chi tiết ứng tuyển' : 'Việc làm đã ứng tuyển'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCloseAppliedJobsModal}
                style={styles.closeExplorerBtn}
              >
                <Ionicons name="close" size={24} color={isDark ? '#9BA1A6' : '#687076'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.appliedJobsModalContent}>
              {selectedAppliedJob ? (
                <View>
                  <View style={[styles.appliedDetailCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC', borderColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}>
                    <View style={styles.appliedJobTopRow}>
                      <View style={[styles.appliedJobIcon, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                        <Ionicons name="briefcase" size={20} color="#0084FF" />
                      </View>
                      <View style={styles.appliedJobTextCol}>
                        <Text style={[styles.appliedDetailTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                          {selectedAppliedJob.title}
                        </Text>
                        <Text style={styles.appliedJobMeta}>
                          {selectedAppliedJob.salary}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailInfoGrid}>
                      <View style={styles.detailInfoRow}>
                        <Ionicons name="business-outline" size={16} color="#0084FF" />
                        <Text style={[styles.detailInfoText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                          Công ty: {selectedAppliedJob.company}
                        </Text>
                      </View>
                      <View style={styles.detailInfoRow}>
                        <Ionicons name="location-outline" size={16} color="#0084FF" />
                        <Text style={[styles.detailInfoText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                          {selectedAppliedJob.location}
                        </Text>
                      </View>
                      <View style={styles.detailInfoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#0084FF" />
                        <Text style={[styles.detailInfoText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                          Ứng tuyển ngày {formatAppliedDate(selectedAppliedJob.appliedAt)}
                        </Text>
                      </View>
                      <View style={styles.detailInfoRow}>
                        <Ionicons name="person-outline" size={16} color="#0084FF" />
                        <Text style={[styles.detailInfoText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                          Hồ sơ: {selectedAppliedJob.applicantName || displayName}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.appliedActionsRow}>
                      <View style={[styles.appliedStatusButton, { backgroundColor: '#E8F5E9' }]}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.appliedStatusButtonText}>Đã ứng tuyển</Text>
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleCancelApplication}
                        style={styles.cancelApplicationButton}
                      >
                        <Ionicons name="close-circle-outline" size={16} color="#FF3B30" />
                        <Text style={styles.cancelApplicationButtonText}>Hủy ứng tuyển</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.appliedDetailCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC', borderColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}>
                    <View style={styles.reviewHeaderRow}>
                      <Text style={[styles.reviewTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                        Đánh giá công ty
                      </Text>
                      <View
                        style={[
                          styles.reviewStatusBadge,
                          {
                            backgroundColor: `${getReviewStatusColor(
                              selectedAppliedJob.reviewStatus,
                              !!selectedAppliedJob.companyRating
                            )}20`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.reviewStatusText,
                            {
                              color: getReviewStatusColor(
                                selectedAppliedJob.reviewStatus,
                                !!selectedAppliedJob.companyRating
                              ),
                            },
                          ]}
                        >
                          {getReviewStatusLabel(
                            selectedAppliedJob.reviewStatus,
                            !!selectedAppliedJob.companyRating
                          )}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.ratingRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          activeOpacity={0.75}
                          onPress={() => setCompanyRating(star)}
                          style={styles.starButton}
                        >
                          <Ionicons
                            name={star <= companyRating ? 'star' : 'star-outline'}
                            size={30}
                            color={star <= companyRating ? '#FFB300' : (isDark ? '#555' : '#B0BEC5')}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={[
                        styles.companyCommentInput,
                        {
                          color: isDark ? '#FFF' : '#11181C',
                          borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
                          backgroundColor: isDark ? '#1C1C1E' : '#FFF',
                        },
                      ]}
                      placeholder="Nhập nhận xét của bạn về công ty..."
                      placeholderTextColor={isDark ? '#6B7280' : '#8E8E93'}
                      multiline
                      textAlignVertical="top"
                      value={companyComment}
                      onChangeText={setCompanyComment}
                    />
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleSaveCompanyReview}
                      style={styles.saveReviewButton}
                    >
                      <Text style={styles.saveReviewButtonText}>Lưu đánh giá</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : appliedJobs.length === 0 ? (
                <View style={styles.emptyAppliedBox}>
                  <Ionicons name="briefcase-outline" size={36} color={isDark ? '#6B7280' : '#B0BEC5'} />
                  <Text style={[styles.emptyAppliedTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                    Bạn chưa ứng tuyển công việc nào
                  </Text>
                  <Text style={styles.emptyAppliedText}>
                    Các công việc đã gửi hồ sơ sẽ được lưu tại đây.
                  </Text>
                </View>
              ) : (
                <View style={styles.appliedList}>
                  {appliedJobs.map((application) => (
                    <TouchableOpacity
                      key={application.id}
                      activeOpacity={0.8}
                      onPress={() => handleOpenAppliedJobDetail(application.id)}
                      style={[
                        styles.appliedJobItem,
                        {
                          backgroundColor: isDark ? '#151718' : '#F8FAFC',
                          borderColor: isDark ? '#2C2C2E' : '#ECEFF1',
                        },
                      ]}
                    >
                      <View style={styles.appliedJobTopRow}>
                        <View style={[styles.appliedJobIcon, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                          <Ionicons name="briefcase" size={18} color="#0084FF" />
                        </View>
                        <View style={styles.appliedJobTextCol}>
                          <Text style={[styles.appliedJobTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={2}>
                            {application.title}
                          </Text>
                          <Text style={styles.appliedJobMeta} numberOfLines={1}>
                            {application.salary} • {application.location}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.appliedJobBottomRow}>
                        <Text style={styles.appliedDateText}>
                          Ứng tuyển: {formatAppliedDate(application.appliedAt)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${getApplicationStatusColor(application.status)}20` }]}>
                          <Text style={[styles.statusBadgeText, { color: getApplicationStatusColor(application.status) }]}>
                            {getApplicationStatusLabel(application.status)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isSavedJobsModalVisible}
        onRequestClose={handleCloseSavedJobsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.appliedJobsModalContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={[styles.explorerHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {selectedSavedJob ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSelectedSavedJobId(null)}
                    style={styles.appliedBackButton}
                  >
                    <Ionicons name="arrow-back" size={22} color={isDark ? '#FFF' : '#11181C'} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="heart-outline" size={22} color="#0084FF" style={{ marginRight: 8 }} />
                )}
                <Text style={[styles.explorerTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {selectedSavedJob ? 'Chi tiết việc đã lưu' : 'Việc làm đã lưu'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCloseSavedJobsModal}
                style={styles.closeExplorerBtn}
              >
                <Ionicons name="close" size={24} color={isDark ? '#9BA1A6' : '#687076'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.appliedJobsModalContent}>
              {selectedSavedJob ? (
                <View>
                  <View style={[styles.appliedDetailCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC', borderColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}>
                    <View style={styles.appliedJobTopRow}>
                      <View style={[styles.appliedJobIcon, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                        <Ionicons name="heart" size={20} color="#0084FF" />
                      </View>
                      <View style={styles.appliedJobTextCol}>
                        <Text style={[styles.appliedDetailTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                          {selectedSavedJob.title}
                        </Text>
                        <Text style={styles.appliedJobMeta}>
                          {selectedSavedJob.salary}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailInfoGrid}>
                      <View style={styles.detailInfoRow}>
                        <Ionicons name="location-outline" size={16} color="#0084FF" />
                        <Text style={[styles.detailInfoText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                          {selectedSavedJob.location}
                        </Text>
                      </View>
                      <View style={styles.detailInfoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#0084FF" />
                        <Text style={[styles.detailInfoText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                          Lưu ngày {formatSavedDate(selectedSavedJob.savedAt)}
                        </Text>
                      </View>
                      <View style={styles.detailInfoRow}>
                        <Ionicons name="time-outline" size={16} color="#0084FF" />
                        <Text style={[styles.detailInfoText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                          {selectedSavedJob.deadline ? `Hạn chót: ${selectedSavedJob.deadline}` : 'Hạn chót: Đang cập nhật'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.appliedActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleViewSavedJob}
                        style={[styles.appliedStatusButton, { backgroundColor: '#E8F5E9' }]}
                      >
                        <Ionicons name="open-outline" size={16} color="#4CAF50" />
                        <Text style={styles.appliedStatusButtonText}>Xem tin</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleRemoveSavedJob}
                        style={styles.cancelApplicationButton}
                      >
                        <Ionicons name="heart-dislike-outline" size={16} color="#FF3B30" />
                        <Text style={styles.cancelApplicationButtonText}>Bỏ lưu</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : savedJobDetails.length === 0 ? (
                <View style={styles.emptyAppliedBox}>
                  <Ionicons name="heart-outline" size={36} color={isDark ? '#6B7280' : '#B0BEC5'} />
                  <Text style={[styles.emptyAppliedTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                    Bạn chưa lưu công việc nào
                  </Text>
                  <Text style={styles.emptyAppliedText}>
                    Các công việc bạn bấm lưu sẽ được hiển thị tại đây.
                  </Text>
                </View>
              ) : (
                <View style={styles.appliedList}>
                  {savedJobDetails.map((savedJob) => (
                    <TouchableOpacity
                      key={savedJob.id}
                      activeOpacity={0.8}
                      onPress={() => handleOpenSavedJobDetail(savedJob.id)}
                      style={[
                        styles.appliedJobItem,
                        {
                          backgroundColor: isDark ? '#151718' : '#F8FAFC',
                          borderColor: isDark ? '#2C2C2E' : '#ECEFF1',
                        },
                      ]}
                    >
                      <View style={styles.appliedJobTopRow}>
                        <View style={[styles.appliedJobIcon, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                          <Ionicons name="heart" size={18} color="#0084FF" />
                        </View>
                        <View style={styles.appliedJobTextCol}>
                          <Text style={[styles.appliedJobTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={2}>
                            {savedJob.title}
                          </Text>
                          <Text style={styles.appliedJobMeta} numberOfLines={1}>
                            {savedJob.salary} • {savedJob.location}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.appliedJobBottomRow}>
                        <Text style={styles.appliedDateText}>
                          Lưu: {formatSavedDate(savedJob.savedAt)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: '#E6F4FE' }]}>
                          <Text style={[styles.statusBadgeText, { color: '#0084FF' }]}>
                            Đã lưu
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isViewedJobsModalVisible}
        onRequestClose={handleCloseViewedJobsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.appliedJobsModalContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={[styles.explorerHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {selectedViewedJob ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSelectedViewedJobId(null)}
                    style={styles.appliedBackButton}
                  >
                    <Ionicons name="arrow-back" size={22} color={isDark ? '#FFF' : '#11181C'} />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="eye-outline" size={22} color="#0084FF" style={{ marginRight: 8 }} />
                )}
                <Text style={[styles.explorerTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {selectedViewedJob ? 'Chi tiết việc đã xem' : 'Việc làm đã xem'}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCloseViewedJobsModal}
                style={styles.closeExplorerBtn}
              >
                <Ionicons name="close" size={24} color={isDark ? '#9BA1A6' : '#687076'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.appliedJobsModalContent}>
              {selectedViewedJob ? (
                <View>
                  <View style={[styles.appliedDetailCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC', borderColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}>
                    <View style={styles.appliedJobTopRow}>
                      <View style={[styles.appliedJobIcon, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                        <Ionicons name="eye" size={20} color="#0084FF" />
                      </View>
                      <View style={styles.appliedJobTextCol}>
                        <Text style={[styles.appliedDetailTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                          {selectedViewedJob.title}
                        </Text>
                        <Text style={styles.appliedJobMeta}>
                          {selectedViewedJob.salary}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailInfoGrid}>
                      <View style={styles.detailInfoRow}>
                        <Ionicons name="location-outline" size={16} color="#0084FF" />
                        <Text style={[styles.detailInfoText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                          {selectedViewedJob.location}
                        </Text>
                      </View>
                      <View style={styles.detailInfoRow}>
                        <Ionicons name="calendar-outline" size={16} color="#0084FF" />
                        <Text style={[styles.detailInfoText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                          Xem ngày {formatSavedDate(selectedViewedJob.viewedAt)}
                        </Text>
                      </View>
                      <View style={styles.detailInfoRow}>
                        <Ionicons name="time-outline" size={16} color="#0084FF" />
                        <Text style={[styles.detailInfoText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                          {selectedViewedJob.deadline ? `Hạn chót: ${selectedViewedJob.deadline}` : 'Hạn chót: Đang cập nhật'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.appliedActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleViewViewedJob}
                        style={[styles.appliedStatusButton, { backgroundColor: '#E8F5E9' }]}
                      >
                        <Ionicons name="open-outline" size={16} color="#4CAF50" />
                        <Text style={styles.appliedStatusButtonText}>Xem tin</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleRemoveViewedJob}
                        style={styles.cancelApplicationButton}
                      >
                        <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                        <Text style={styles.cancelApplicationButtonText}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : viewedJobDetails.length === 0 ? (
                <View style={styles.emptyAppliedBox}>
                  <Ionicons name="eye-outline" size={36} color={isDark ? '#6B7280' : '#B0BEC5'} />
                  <Text style={[styles.emptyAppliedTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                    Bạn chưa xem công việc nào
                  </Text>
                  <Text style={styles.emptyAppliedText}>
                    Các công việc bạn đã mở chi tiết sẽ được hiển thị tại đây.
                  </Text>
                </View>
              ) : (
                <View style={styles.appliedList}>
                  {viewedJobDetails.map((viewedJob) => (
                    <TouchableOpacity
                      key={viewedJob.id}
                      activeOpacity={0.8}
                      onPress={() => handleOpenViewedJobDetail(viewedJob.id)}
                      style={[
                        styles.appliedJobItem,
                        {
                          backgroundColor: isDark ? '#151718' : '#F8FAFC',
                          borderColor: isDark ? '#2C2C2E' : '#ECEFF1',
                        },
                      ]}
                    >
                      <View style={styles.appliedJobTopRow}>
                        <View style={[styles.appliedJobIcon, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                          <Ionicons name="eye" size={18} color="#0084FF" />
                        </View>
                        <View style={styles.appliedJobTextCol}>
                          <Text style={[styles.appliedJobTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={2}>
                            {viewedJob.title}
                          </Text>
                          <Text style={styles.appliedJobMeta} numberOfLines={1}>
                            {viewedJob.salary} • {viewedJob.location}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.appliedJobBottomRow}>
                        <Text style={styles.appliedDateText}>
                          Xem: {formatSavedDate(viewedJob.viewedAt)}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: '#E6F4FE' }]}>
                          <Text style={[styles.statusBadgeText, { color: '#0084FF' }]}>
                            Đã xem
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Job Modal */}
      <Modal
        visible={isEditJobModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalCenteredOverlay}>
          <View style={[styles.verificationContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <Text style={[styles.verificationTitle, { color: isDark ? '#FFF' : '#11181C', marginBottom: 10 }]}>Cập nhật Công việc</Text>
            <Text style={[styles.verificationSubtitle, { color: isDark ? '#9BA1A6' : '#687076', marginBottom: 20 }]}>
              Nhập vị trí hoặc công việc bạn mong muốn để nhà tuyển dụng dễ dàng tìm thấy bạn.
            </Text>
            
            <View style={[styles.verificationInputWrapper, { borderColor: isDark ? '#2C2C2E' : '#E5E5EA', backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}>
              <TextInput
                style={[styles.verificationTextInput, { color: isDark ? '#FFF' : '#11181C', letterSpacing: 0, textAlign: 'left', width: '100%' }]}
                value={editJobInput}
                onChangeText={setEditJobInput}
                placeholder="VD: Frontend Developer"
                placeholderTextColor={isDark ? '#8E8E93' : '#AEAEB2'}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.verificationSubmitBtn, { flex: 1, backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}
                onPress={() => setIsEditJobModalVisible(false)}
              >
                <Text style={[styles.verificationSubmitBtnText, { color: isDark ? '#FFF' : '#11181C' }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.verificationSubmitBtn, { flex: 1, backgroundColor: '#0084FF' }]}
                onPress={handleSaveJob}
              >
                <Text style={styles.verificationSubmitBtnText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Phone Modal */}
      <Modal
        visible={isEditPhoneModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalCenteredOverlay}>
          <View style={[styles.verificationContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <Text style={[styles.verificationTitle, { color: isDark ? '#FFF' : '#11181C', marginBottom: 10 }]}>Cập nhật Số điện thoại</Text>
            <Text style={[styles.verificationSubtitle, { color: isDark ? '#9BA1A6' : '#687076', marginBottom: 20 }]}>
              Nhập số điện thoại liên hệ của bạn để cập nhật vào thông tin cá nhân và đồng bộ với trang quản trị.
            </Text>
            
            <View style={[styles.verificationInputWrapper, { borderColor: isDark ? '#2C2C2E' : '#E5E5EA', backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}>
              <TextInput
                style={[styles.verificationTextInput, { color: isDark ? '#FFF' : '#11181C', letterSpacing: 0, textAlign: 'left', width: '100%' }]}
                value={editPhoneInput}
                onChangeText={setEditPhoneInput}
                placeholder="VD: 0912345678"
                placeholderTextColor={isDark ? '#8E8E93' : '#AEAEB2'}
                keyboardType="phone-pad"
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.verificationSubmitBtn, { flex: 1, backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}
                onPress={() => setIsEditPhoneModalVisible(false)}
              >
                <Text style={[styles.verificationSubmitBtnText, { color: isDark ? '#FFF' : '#11181C' }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.verificationSubmitBtn, { flex: 1, backgroundColor: '#0084FF' }]}
                onPress={handleSavePhone}
              >
                <Text style={styles.verificationSubmitBtnText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              Hệ thống đã gửi mã xác thực gồm 6 chữ số tới liên hệ đăng ký của bạn. Vui lòng kiểm tra hộp thư email để lấy mã OTP và hoàn tất xác minh.
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

  appliedCountBadge: {
    marginLeft: 'auto',
    minWidth: 26,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appliedCountText: {
    color: '#0084FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  appliedJobsModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  appliedJobsModalContent: {
    padding: 16,
    paddingBottom: 28,
  },
  appliedBackButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  emptyAppliedBox: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  emptyAppliedTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyAppliedText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 17,
  },
  appliedList: {
    gap: 10,
  },
  appliedJobItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  appliedJobTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  appliedJobIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  appliedJobTextCol: {
    flex: 1,
  },
  appliedJobTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  appliedJobMeta: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 4,
  },
  appliedJobBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  appliedDateText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  appliedDetailCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  appliedDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  detailInfoGrid: {
    gap: 10,
    marginTop: 14,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailInfoText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  appliedActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  appliedStatusButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  appliedStatusButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelApplicationButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cancelApplicationButtonText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  reviewTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
  },
  reviewStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  starButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyCommentInput: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  saveReviewButton: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  saveReviewButtonText: {
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

  // Recruiter profile merged styles
  empHeroSection: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  empBannerImage: {
    width: '100%',
    height: '100%',
  },
  empLogoWrapper: {
    position: 'absolute',
    bottom: -35,
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  empLogoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  empProfileDetails: {
    alignItems: 'center',
    marginTop: 45,
    marginBottom: 16,
  },
  empCompanyName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  empLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  empLocationText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  empStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  empStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  empStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  empStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  empPostJobBtn: {
    flexDirection: 'row',
    backgroundColor: '#0084FF',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 6,
  },
  empPostJobBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  empSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  empSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  empSeeAllLink: {
    fontSize: 13,
    color: '#0084FF',
    fontWeight: '600',
  },
  empJobsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  empJobCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  empJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  empJobTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  empJobBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  empJobBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  empJobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  empJobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  empJobMetaText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  empJobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empApplicantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empApplicantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  empApplicantsMore: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0084FF',
    marginLeft: 6,
  },
  empJobSalaryBox: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  empJobSalaryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0084FF',
  },
  empPkgCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderWidth: 1.5,
  },
  empPkgCardPopular: {
    borderWidth: 2,
    borderColor: '#0084FF',
  },
  empPkgTagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  empPkgTagBubble: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  empPkgTagText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  empPkgSubTagBubble: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  empPkgSubTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  empPkgPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  empPkgName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  empPkgPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  empPkgFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  empPkgFeatureIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  empPkgFeatureText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  empPkgBuyBtn: {
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  empPkgBuyBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  empBenefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  empBenefitIconFrame: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  empBenefitTextCol: {
    flex: 1,
  },
  empBenefitCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  empBenefitCardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  empPromoFrame: {
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    position: 'relative',
  },
  empPromoImage: {
    width: '100%',
    height: '100%',
  },
  empPromoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 30, 54, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  empPromoText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

import RecruiterProfileScreen from '../recruiter/profile';

export default function ProfileScreen() {
  const { userRole } = useAuth();
  if (userRole === 'employer') {
    return <RecruiterProfileScreen />;
  }
  return <CandidateProfileScreen />;
}
