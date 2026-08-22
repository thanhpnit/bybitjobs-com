import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth, formatDeadlineDisplay } from '@/hooks/use-auth';
import { db } from '../src/config/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';

const getFirstText = (...values: unknown[]) => {
  const value = values.find((item) => typeof item === 'string' && item.trim());
  return typeof value === 'string' ? value.trim() : '';
};

type EmployerProfileInfo = {
  displayName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  rating?: number;
  reviewCount?: number;
};

export default function JobDetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { isLoggedIn, userRole, userData, jobs, savedJobs, toggleSavedJob, addViewedJob } = useAuth();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [employerInfoModalVisible, setEmployerInfoModalVisible] = useState(false);
  const [employerName, setEmployerName] = useState('Nhà tuyển dụng');
  const [employerInfo, setEmployerInfo] = useState<EmployerProfileInfo | null>(null);
  const [approvedReviews, setApprovedReviews] = useState<any[]>([]);
  const [reportForm, setReportForm] = useState({
    reason: '',
    otherReason: '',
  });
  const reportReasons = [
    'Tin đăng có dấu hiệu lừa đảo',
    'Thông tin đăng không chính xác',
    'Lý do khác',
  ];

  // Get dynamic title from homepage navigation
  const { title, jobId, salary, location } = useLocalSearchParams<{
    title: string;
    jobId?: string;
    salary?: string;
    location?: string;
  }>();
  const currentJob = React.useMemo(() => {
    if (jobId) {
      const matchById = jobs.find((job) => job.id === jobId);
      if (matchById) return matchById;
    }

    if (title) {
      return jobs.find((job) => job.title === title);
    }

    return undefined;
  }, [jobId, jobs, title]);

  const displayTitle = currentJob?.title || title || 'Thông tin việc làm';
  const displaySalary = currentJob?.salary || salary || 'Thỏa thuận';
  const displayLocation = currentJob?.location || location || 'Chưa cập nhật địa điểm';
  const displayJobId = currentJob?.id || jobId || `job-${displayTitle.trim().toLowerCase().replace(/\s+/g, '-')}`;
  const rawExperience = getFirstText((currentJob as any)?.experience, (currentJob as any)?.workingExperience);
  const displayExperience = React.useMemo(() => {
    if (rawExperience) return rawExperience;

    const fullText = `${currentJob?.requirements || ''} ${currentJob?.description || ''}`.toLowerCase();
    if (!fullText.trim()) return 'Theo chi tiết yêu cầu';

    if (fullText.includes('không cần kinh nghiệm') || fullText.includes('không yêu cầu kinh nghiệm') || fullText.includes('chưa có kinh nghiệm')) {
      return 'Không yêu cầu kinh nghiệm';
    }
    if (fullText.includes('thực tập') || fullText.includes('intern') || fullText.includes('fresher') || fullText.includes('sinh viên')) {
      return 'Dưới 1 năm / Fresher';
    }
    if (fullText.includes('5 năm') || fullText.includes('senior')) {
      return 'Trên 5 năm (Senior)';
    }
    if (fullText.includes('2 năm') || fullText.includes('3 năm') || fullText.includes('4 năm')) {
      return '2 - 5 năm kinh nghiệm';
    }
    if (fullText.includes('1 năm') || fullText.includes('có kinh nghiệm')) {
      return '1 - 2 năm kinh nghiệm';
    }

    return 'Theo chi tiết yêu cầu';
  }, [rawExperience, currentJob?.requirements, currentJob?.description]);
  const isSaved = savedJobs.some((savedJob) => savedJob.jobId === displayJobId);
  const isEmployerView = userRole === 'employer';
  const reporterName = userData?.fullName || 'Người dùng';
  const reporterEmail = userData?.emailOrPhone || 'Chưa cập nhật';
  const reporterPhone = userData?.phone || 'Chưa cập nhật';
  const addViewedJobRef = React.useRef(addViewedJob);
  const storedPosterName =
    currentJob?.posterName ||
    currentJob?.posterFullName ||
    currentJob?.postedByName ||
    currentJob?.authorName;

  React.useEffect(() => {
    addViewedJobRef.current = addViewedJob;
  }, [addViewedJob]);

  React.useEffect(() => {
    if (!isLoggedIn) return;

    addViewedJobRef.current({
      jobId: displayJobId,
      jobTitle: displayTitle,
      jobSalary: displaySalary,
      jobLocation: displayLocation,
    });
  }, [displayJobId, displayLocation, displaySalary, displayTitle, isLoggedIn]);

  React.useEffect(() => {
    let isActive = true;

    const loadEmployerName = async () => {
      if (!currentJob?.employerId) {
        const fallbackName = getFirstText(storedPosterName, 'Nhà tuyển dụng');
        if (isActive) {
          setEmployerName(fallbackName);
          setEmployerInfo({
            displayName: fallbackName,
            companyName: fallbackName,
            phone: 'Chưa cập nhật',
            email: 'Chưa cập nhật',
            address: displayLocation,
          });
        }
        return;
      }

      try {
        let apiUserData: any = null;
        let employerData: any = null;

        const userResponse = await fetch(`http://160.250.246.119:4000/api/users/${currentJob.employerId}`);
        if (userResponse.ok) {
          apiUserData = await userResponse.json();
        }

        const employerSnapshot = await getDoc(doc(db, 'employers', currentJob.employerId));
        employerData = employerSnapshot.exists() ? employerSnapshot.data() : null;
        const name = getFirstText(
          storedPosterName,
          employerData?.companyName,
          employerData?.company,
          employerData?.name,
          employerData?.posterName,
          employerData?.fullName,
          employerData?.contactName,
          employerData?.ownerName,
          apiUserData?.fullName,
          apiUserData?.full_name,
          apiUserData?.displayName,
          apiUserData?.name
        ) || 'Nhà tuyển dụng';

        if (isActive) {
          setEmployerName(name);
          setEmployerInfo({
            displayName: name,
            companyName: getFirstText(employerData?.companyName, employerData?.company, employerData?.name, name),
            phone: getFirstText(employerData?.phoneNumber, employerData?.phone, apiUserData?.phone, apiUserData?.phoneNumber, 'Chưa cập nhật'),
            email: getFirstText(employerData?.email, apiUserData?.email, apiUserData?.emailOrPhone, 'Chưa cập nhật'),
            address: getFirstText(employerData?.address, employerData?.location, displayLocation, 'Chưa cập nhật'),
            rating: employerData?.rating ? Number(employerData.rating) : undefined,
            reviewCount: employerData?.reviewCount || employerData?.totalReviews,
          });
        }
      } catch (error) {
        console.error('Lỗi lấy thông tin nhà tuyển dụng:', error);
        const fallbackName = getFirstText(storedPosterName, 'Nhà tuyển dụng');
        if (isActive) {
          setEmployerName(fallbackName);
          setEmployerInfo({
            displayName: fallbackName,
            companyName: fallbackName,
            phone: 'Chưa cập nhật',
            email: 'Chưa cập nhật',
            address: displayLocation,
          });
        }
      }
    };

    loadEmployerName();

    return () => {
      isActive = false;
    };
  }, [currentJob?.employerId, currentJob?.industry, displayLocation, storedPosterName]);

  React.useEffect(() => {
    const compName = employerInfo?.companyName || employerName;
    if (!compName || compName === 'Nhà tuyển dụng') return;

    const unsubscribe = onSnapshot(collection(db, 'applications'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        const val = docSnap.data();
        const cName = val.companyName || val.company || '';
        const status = val.reviewStatus || 'Đã phê duyệt';
        const r = Number(val.companyRating || 0);

        if (cName.toLowerCase().trim() === compName.toLowerCase().trim() && status !== 'Bị báo cáo' && (r > 0 || (val.companyComment && val.companyComment.trim().length > 0))) {
          list.push({
            id: docSnap.id,
            applicantName: val.applicantName || val.candidateName || 'Ứng viên ẩn danh',
            rating: r > 0 ? r : 5,
            comment: val.companyComment || '',
            reviewedAt: val.reviewedAt || val.appliedAt || '',
          });
        }
      });
      list.sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
      setApprovedReviews(list);
    }, (err) => console.log('Lỗi tải đánh giá đã duyệt:', err));

    return () => unsubscribe();
  }, [employerInfo?.companyName, employerName]);

  const companyRatingDisplay = React.useMemo(() => {
    if (approvedReviews.length > 0) {
      const total = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
      return (total / approvedReviews.length).toFixed(1);
    }
    if (employerInfo?.rating) return Number(employerInfo.rating).toFixed(1);
    return '5.0';
  }, [employerInfo?.rating, approvedReviews]);

  const handleSaveJob = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const result = await toggleSavedJob({
      jobId: displayJobId,
      jobTitle: displayTitle,
      jobSalary: displaySalary,
      jobLocation: displayLocation,
    });
    Alert.alert('Thông báo', result.message);
  };

  const handleApply = () => {
    if (!isLoggedIn) {
      router.push({
        pathname: '/login',
        params: { redirectTitle: displayTitle }
      });
      return;
    }

    if (!userData?.isVerified) {
      Alert.alert(
        'Cần xác minh tài khoản',
        'Bạn cần xác minh tài khoản trước khi ứng tuyển công việc.',
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Xác minh ngay', onPress: () => router.push('/(tabs)/profile') },
        ]
      );
      return;
    }

    router.push({
      pathname: '/apply-job',
      params: {
        title: displayTitle,
        jobId: displayJobId,
        companyName: employerName,
        salary: displaySalary,
        location: displayLocation,
      }
    });
  };

  const handleReport = () => {
    if (!isLoggedIn) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để có thể báo cáo công việc này.', [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng nhập', 
          onPress: () => router.push({
            pathname: '/login',
            params: { redirectTitle: displayTitle }
          })
        }
      ]);
    } else {
      setReportModalVisible(true);
    }
  };

  const renderEmployerInfoRow = (icon: keyof typeof Ionicons.glyphMap, label: string, value?: string) => (
    <View style={[styles.employerDetailRow, { backgroundColor: isDark ? '#2C2C2E' : '#F8FAFC' }]}>
      <View style={[styles.employerDetailIcon, { backgroundColor: isDark ? '#1C2A3A' : '#F1F5F9' }]}>
        <Ionicons name={icon} size={17} color="#0F172A" />
      </View>
      <View style={styles.employerDetailTextCol}>
        <Text style={styles.employerDetailLabel}>{label}</Text>
        <Text style={[styles.employerDetailValue, { color: isDark ? '#FFF' : '#11181C' }]}>
          {value || 'Chưa cập nhật'}
        </Text>
      </View>
    </View>
  );

  const renderHeroMetric = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    value: string,
    showDivider = true
  ) => (
    <View style={[styles.heroMetricItem, showDivider && styles.heroMetricDivider]}>
      <View style={styles.heroMetricIconBox}>
        <Ionicons name={icon} size={22} color="#0F172A" />
      </View>
      <Text style={styles.heroMetricLabel}>{label}</Text>
      <Text style={styles.heroMetricValue}>
        {value}
      </Text>
    </View>
  );

  const renderInfoChip = (label: string) => (
    <View key={label} style={[styles.infoChip, { backgroundColor: isDark ? '#2C2C2E' : '#F1F5F9' }]}>
      <Text style={[styles.infoChipText, { color: isDark ? '#ECEDEE' : '#334155' }]}>
        {label}
      </Text>
    </View>
  );

  const renderCompanyDetailItem = (icon: keyof typeof Ionicons.glyphMap, label: string, value?: string) => (
    <View style={[styles.companyDetailItem, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
      <View style={[styles.companyDetailIcon, { backgroundColor: isDark ? '#1C2A3A' : '#F1F5F9' }]}>
        <Ionicons name={icon} size={18} color="#0F172A" />
      </View>
      <View style={styles.companyDetailTextCol}>
        <Text style={styles.companyDetailLabel}>{label}</Text>
        <Text style={[styles.companyDetailValue, { color: isDark ? '#FFF' : '#11181C' }]}>
          {value || 'Chưa cập nhật'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Blue Header Background */}
      <View style={styles.headerBg} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#11181C" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setEmployerInfoModalVisible(true)}
            style={styles.moreButton}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#11181C" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Hero Summary Card */}
          <View style={[styles.heroSummaryCard, isDark && styles.darkCard]}>
            <View style={[styles.heroLogoWrap, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              {(currentJob as any)?.image ? (
                <Image
                  source={{ uri: (currentJob as any).image }}
                  style={styles.heroLogoImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="business" size={38} color="#0084FF" />
              )}
            </View>

            <Text style={[styles.heroJobTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
              {displayTitle}
            </Text>
            <TouchableOpacity activeOpacity={0.85} onPress={() => setEmployerInfoModalVisible(true)}>
              <Text style={styles.heroCompanyName}>
                {employerInfo?.companyName || employerName}
              </Text>
            </TouchableOpacity>

            <View style={styles.heroMetricsRow}>
              {renderHeroMetric('cash-outline', 'Mức lương', displaySalary)}
              {renderHeroMetric('location-outline', 'Địa điểm', displayLocation)}
              {renderHeroMetric('star-outline', 'Kinh nghiệm', displayExperience, false)}
            </View>
          </View>

          <View style={[styles.detailTabs, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
            <View style={styles.detailTabActive}>
              <Text style={styles.detailTabActiveText}>Thông tin</Text>
            </View>
          </View>

          <View style={styles.infoChipsWrap}>
            {[
              displayExperience,
              currentJob?.industry || 'Tuyển dụng',
              (currentJob as any)?.type || 'Toàn thời gian',
              (currentJob as any)?.isPremium ? 'Tin tuyển dụng HOT' : 'Tin tuyển dụng mới',
              currentJob?.deadline ? `Hạn ứng tuyển ${formatDeadlineDisplay(currentJob.deadline)}` : 'Đang tuyển',
            ].map(renderInfoChip)}
          </View>

          {/* Company Detail Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setEmployerInfoModalVisible(true)}
            style={[styles.companyProfileCard, isDark && styles.darkCard]}
          >
            <View style={styles.companyProfileHeader}>
              <View style={[styles.companyLogoLarge, { backgroundColor: isDark ? '#1C2A3A' : '#EAF5FF' }]}>
                <Ionicons name="business" size={30} color="#0084FF" />
              </View>
              <View style={styles.companyProfileTitleCol}>
                <Text style={styles.companySectionEyebrow}>Công ty tuyển dụng</Text>
                <Text style={[styles.companyProfileName, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={2}>
                  {employerInfo?.companyName || employerName}
                </Text>
                <View style={styles.companyRatingLine}>
                  <Ionicons name="star" size={14} color="#FFB300" />
                  <Text style={[styles.companyRatingText, { color: isDark ? '#ECEDEE' : '#334155' }]}>{companyRatingDisplay}</Text>
                  <Text style={styles.companyMutedText}>• Nhà tuyển dụng đã xác thực</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#9BA1A6' : '#8E8E93'} />
            </View>

            <View style={styles.companyDetailsGrid}>
              {renderCompanyDetailItem('person-outline', 'Người đại diện', employerInfo?.displayName || employerName)}
              {renderCompanyDetailItem('call-outline', 'Số điện thoại', employerInfo?.phone)}
              {renderCompanyDetailItem('mail-outline', 'Email', employerInfo?.email)}
              {renderCompanyDetailItem('location-outline', 'Địa chỉ', employerInfo?.address)}
            </View>
          </TouchableOpacity>

          {/* Job Description (Mô tả công việc) */}
          <View style={[styles.whiteCard, styles.sectionCard, isDark && styles.darkCard]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="reader-outline" size={20} color="#0084FF" style={styles.sectionHeaderIcon} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Mô tả công việc
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />
            
            <View style={styles.bulletList}>
              {currentJob?.description ? (
                currentJob.description.split('\n').filter(line => line.trim()).map((line, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                    <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                      {line.trim().replace(/^-\s*/, '')}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: isDark ? '#ECEDEE' : '#333', fontSize: 13, fontStyle: 'italic' }}>
                  Chưa có mô tả chi tiết công việc.
                </Text>
              )}
            </View>
          </View>

          {/* Requirements (Yêu cầu) */}
          <View style={[styles.whiteCard, styles.sectionCard, isDark && styles.darkCard]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkbox-outline" size={20} color="#0084FF" style={styles.sectionHeaderIcon} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Yêu cầu tuyển dụng
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

            <View style={styles.bulletList}>
              {currentJob?.requirements ? (
                currentJob.requirements.split('\n').filter(line => line.trim()).map((line, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                    <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                      {line.trim().replace(/^-\s*/, '')}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: isDark ? '#ECEDEE' : '#333', fontSize: 13, fontStyle: 'italic' }}>
                  Chưa có yêu cầu cụ thể.
                </Text>
              )}
            </View>
          </View>

          {/* Benefits (Quyền lợi) */}
          {((currentJob as any)?.benefits) ? (
            <View style={[styles.whiteCard, styles.sectionCard, isDark && styles.darkCard]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="gift-outline" size={20} color="#0084FF" style={styles.sectionHeaderIcon} />
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Quyền lợi
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

              <View style={styles.bulletList}>
                {((currentJob as any).benefits as string).split('\n').filter(line => line.trim()).map((line, index) => (
                  <View key={index} style={styles.bulletItem}>
                    <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                    <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                      {line.trim().replace(/^-\s*/, '')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Meta Details Card */}
          <View style={[styles.whiteCard, styles.metaCard, isDark && styles.darkCard]}>
            {/* Location */}
            <View style={styles.metaRow}>
              <View style={[styles.metaIconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="location" size={16} color="#0084FF" />
              </View>
              <View style={styles.metaTextCol}>
                <Text style={[styles.metaLabel, { color: isDark ? '#9BA1A6' : '#687076' }]}>Địa điểm làm việc</Text>
                <Text style={[styles.metaValue, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {displayLocation}
                </Text>
              </View>
            </View>

            {/* Deadline */}
            <View style={styles.metaRow}>
              <View style={[styles.metaIconCircle, { backgroundColor: '#FFEBEE' }]}>
                <Ionicons name="time" size={16} color="#FF3D00" />
              </View>
              <View style={styles.metaTextCol}>
                <Text style={[styles.metaLabel, { color: isDark ? '#9BA1A6' : '#687076' }]}>Hạn ứng tuyển</Text>
                <Text style={[styles.metaValue, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {currentJob?.deadline ? formatDeadlineDisplay(currentJob.deadline) : 'Liên hệ nhà tuyển dụng'}
                </Text>
              </View>
            </View>
          </View>

          {/* Report Job Text */}
          <View style={styles.reportTextContainer}>
            <Text style={[styles.reportText, { color: isDark ? '#ECEDEE' : '#333' }]}>
              Báo cáo tin tuyển dụng: Nếu bạn thấy rằng tin tuyển dụng này không đúng hoặc có dấu hiệu lừa đảo,{' '}
              <Text style={styles.reportTextLink} onPress={handleReport}>
                hãy phản ánh với chúng tôi.
              </Text>
            </Text>
          </View>

          {/* Padding bottom so it doesn't get covered by sticky footer */}
          <View style={styles.scrollPaddingBottom} />
        </ScrollView>
      </SafeAreaView>

      {/* Sticky Action Footer */}
      {!isEmployerView && (
        <View style={[styles.fixedFooter, isDark && styles.darkFooter]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSaveJob}
            style={[styles.saveJobButton, isSaved && styles.saveJobButtonActive]}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? '#FFF' : '#0084FF'}
            />
          </TouchableOpacity>

          {currentJob?.isOpen === false ? (
            <View style={[styles.applyButton, { backgroundColor: isDark ? '#3A3A3C' : '#C7C7CC' }]}>
              <Text style={styles.applyButtonText}>Bài đăng đã hết hạn / Đã đóng</Text>
            </View>
          ) : (
            <TouchableOpacity activeOpacity={0.85} onPress={handleApply} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Ứng tuyển ngay</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" style={styles.applyIcon} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Employer Info Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={employerInfoModalVisible}
        onRequestClose={() => setEmployerInfoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.employerModalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.employerModalHeader}>
              <View style={styles.employerModalHandle} />
              <TouchableOpacity
                style={[styles.employerModalCloseButton, { backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}
                onPress={() => setEmployerInfoModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color={isDark ? '#9BA1A6' : '#687076'} />
              </TouchableOpacity>

              <View style={[styles.employerHeroCard, { backgroundColor: isDark ? '#102538' : '#EAF5FF' }]}>
                <View style={styles.employerHeroPattern} />
                <View style={[styles.employerModalAvatar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                  <Ionicons name="business" size={34} color="#0084FF" />
                </View>
                <Text style={[styles.employerModalTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={2}>
                  {employerInfo?.companyName || employerName}
                </Text>
                <View style={styles.employerBadgeRow}>
                  <View style={[styles.employerVerifiedPill, { backgroundColor: isDark ? '#1C2A3A' : '#FFFFFF' }]}>
                    <Ionicons name="checkmark-circle" size={13} color="#0084FF" />
                    <Text style={styles.employerVerifiedText}>Đã xác thực</Text>
                  </View>
                  <View style={[styles.employerRatingPill, { backgroundColor: isDark ? '#1C2A3A' : '#FFFFFF' }]}>
                    <Ionicons name="star" size={13} color="#FFB300" />
                    <Text style={[styles.employerRatingPillText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>{companyRatingDisplay}</Text>
                  </View>
                </View>
              </View>
            </View>

            <ScrollView style={styles.employerModalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.employerStatsGrid}>
                <View style={[styles.employerStatCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
                  <Ionicons name="briefcase-outline" size={18} color="#0084FF" />
                  <Text style={[styles.employerStatValue, { color: isDark ? '#FFF' : '#11181C' }]}>Đang tuyển</Text>
                  <Text style={styles.employerStatLabel}>Trạng thái</Text>
                </View>
                <View style={[styles.employerStatCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#0084FF" />
                  <Text style={[styles.employerStatValue, { color: isDark ? '#FFF' : '#11181C' }]}>Uy tín</Text>
                  <Text style={styles.employerStatLabel}>Hồ sơ</Text>
                </View>
                <View style={[styles.employerStatCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
                  <Ionicons name="location-outline" size={18} color="#0084FF" />
                  <Text style={[styles.employerStatValue, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                    {displayLocation.split(',').pop()?.trim() || 'Việt Nam'}
                  </Text>
                  <Text style={styles.employerStatLabel}>Khu vực</Text>
                </View>
              </View>

              <Text style={[styles.employerSectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Thông tin liên hệ
              </Text>
              {renderEmployerInfoRow('person-outline', 'Người đại diện', employerInfo?.displayName || employerName)}
              {renderEmployerInfoRow('business-outline', 'Tên công ty', employerInfo?.companyName || employerName)}
              {renderEmployerInfoRow('call-outline', 'Số điện thoại', employerInfo?.phone)}
              {renderEmployerInfoRow('mail-outline', 'Email', employerInfo?.email)}
              {renderEmployerInfoRow('location-outline', 'Địa chỉ', employerInfo?.address)}

              {/* ĐÁNH GIÁ TỪ ỨNG VIÊN KHÁC (COMMUNITY REVIEWS) */}
              <View style={{ marginTop: 20, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={[styles.employerSectionTitle, { color: isDark ? '#FFF' : '#11181C', marginBottom: 0 }]}>
                    Đánh giá từ ứng viên khác ({approvedReviews.length})
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={16} color="#FFB300" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFF' : '#11181C' }}>
                      {companyRatingDisplay}/5
                    </Text>
                  </View>
                </View>

                {approvedReviews.length === 0 ? (
                  <View style={[styles.employerStatCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC', padding: 16, alignItems: 'center' }]}>
                    <Ionicons name="chatbox-ellipses-outline" size={24} color={isDark ? '#9BA1A6' : '#687076'} />
                    <Text style={{ fontSize: 13, color: isDark ? '#9BA1A6' : '#687076', marginTop: 6, textAlign: 'center' }}>
                      Chưa có đánh giá được duyệt cho nhà tuyển dụng này.
                    </Text>
                  </View>
                ) : (
                  approvedReviews.map((rev) => (
                    <View key={rev.id} style={{
                      backgroundColor: isDark ? '#1C2A3A' : '#F8FAFC',
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: isDark ? '#2C3E50' : '#E2E8F0'
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#0084FF', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>
                              {(rev.applicantName || 'U').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#FFF' : '#11181C' }}>
                            {rev.applicantName}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={star <= rev.rating ? 'star' : 'star-outline'}
                              size={12}
                              color={star <= rev.rating ? '#FFB300' : (isDark ? '#555' : '#CBD5E1')}
                            />
                          ))}
                        </View>
                      </View>
                      {rev.comment ? (
                        <Text style={{ fontSize: 13, color: isDark ? '#ECEDEE' : '#334155', lineHeight: 18, marginTop: 4 }}>
                          "{rev.comment}"
                        </Text>
                      ) : null}
                      <Text style={{ fontSize: 11, color: isDark ? '#9BA1A6' : '#94A3B8', marginTop: 6 }}>
                        {rev.reviewedAt ? new Date(rev.reviewedAt).toLocaleDateString('vi-VN') : ''}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setEmployerInfoModalVisible(false)}
                style={styles.employerModalDoneButton}
              >
                <Text style={styles.employerModalDoneText}>Đã hiểu</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.headerCloseButton}
                onPress={() => setReportModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={isDark ? '#9BA1A6' : '#687076'} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Phản ánh tin tuyển dụng</Text>
              <Text style={[styles.modalSubtext, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                Vui lòng tìm hiểu kỹ nhà tuyển dụng. Nếu phát hiện công việc có dấu hiệu lừa đảo, hãy phản ánh để chúng tôi xử lý.
              </Text>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.formRow}>
                <Text style={[styles.formLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Tin tuyển dụng:</Text>
                <Text style={[styles.formValue, { color: isDark ? '#ECEDEE' : '#333' }]}>{displayTitle}</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Lý do báo cáo <Text style={styles.requiredStar}>*</Text>
                </Text>
                <View style={styles.reasonList}>
                  {reportReasons.map((reason) => {
                    const isSelected = reportForm.reason === reason;
                    return (
                      <TouchableOpacity
                        key={reason}
                        activeOpacity={0.8}
                        onPress={() => setReportForm({
                          reason,
                          otherReason: reason === 'Lý do khác' ? reportForm.otherReason : '',
                        })}
                        style={styles.reasonItem}
                      >
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={24}
                          color={isSelected ? '#0084FF' : (isDark ? '#6B7280' : '#B0BEC5')}
                        />
                        <Text style={[styles.reasonText, { color: isDark ? '#ECEDEE' : '#253341' }]}>
                          {reason}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {reportForm.reason === 'Lý do khác' && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: isDark ? '#FFF' : '#11181C' }]}>
                    Nhập lý do khác <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.textArea, { color: isDark ? '#FFF' : '#11181C', backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}
                    placeholder="Bạn vui lòng nhập rõ lý do báo cáo..."
                    placeholderTextColor={isDark ? '#9BA1A6' : '#9CA3AF'}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={reportForm.otherReason}
                    onChangeText={(text) => setReportForm({ ...reportForm, otherReason: text })}
                  />
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

              <Text style={[styles.formLabel, { color: isDark ? '#FFF' : '#11181C' }]}>
                Thông tin người báo cáo
              </Text>
              <View style={[styles.reporterInfoBox, { backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}>
                <View style={styles.reporterInfoRow}>
                  <Text style={styles.reporterInfoLabel}>Người báo cáo</Text>
                  <Text style={[styles.reporterInfoValue, { color: isDark ? '#FFF' : '#11181C' }]}>{reporterName}</Text>
                </View>
                <View style={styles.reporterInfoRow}>
                  <Text style={styles.reporterInfoLabel}>Số điện thoại</Text>
                  <Text style={[styles.reporterInfoValue, { color: isDark ? '#FFF' : '#11181C' }]}>{reporterPhone}</Text>
                </View>
                <View style={styles.reporterInfoRow}>
                  <Text style={styles.reporterInfoLabel}>Email</Text>
                  <Text style={[styles.reporterInfoValue, { color: isDark ? '#FFF' : '#11181C' }]}>{reporterEmail}</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]}
                activeOpacity={0.85}
                onPress={async () => {
                  if (!reportForm.reason) {
                    Alert.alert('Thông báo', 'Vui lòng chọn lý do báo cáo.');
                    return;
                  }

                  const finalReason = reportForm.reason === 'Lý do khác'
                    ? reportForm.otherReason.trim()
                    : reportForm.reason;

                  if (!finalReason) {
                    Alert.alert('Thông báo', 'Vui lòng nhập lý do báo cáo khác.');
                    return;
                  }

                  try {
                    await addDoc(collection(db, 'reports'), {
                      type: 'Phản ánh tin tuyển dụng',
                      reason: reportForm.reason,
                      desc: finalReason,
                      target: displayTitle,
                      targetBy: `Họ tên: ${reporterName} - SĐT: ${reporterPhone} - Email: ${reporterEmail}`,
                      reporterId: userData?.uid || '',
                      reporterName,
                      reporterPhone,
                      reporterEmail,
                      jobId: displayJobId,
                      companyName: employerName,
                      address: displayLocation,
                      status: 'pending',
                      createdAt: serverTimestamp()
                    });
                    Alert.alert('Thành công', 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xử lý sớm nhất.');
                    setReportModalVisible(false);
                    setReportForm({ reason: '', otherReason: '' });
                  } catch (e) {
                    console.error(e);
                    Alert.alert('Lỗi', 'Không thể gửi báo cáo lúc này. Vui lòng thử lại sau.');
                  }
                }}
              >
                <Text style={styles.sendButtonText}>Gửi báo cáo</Text>
              </TouchableOpacity>
              {/* Extra spacing at bottom for scrolling */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 260 : 240,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 64,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 70,
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
  jobHeaderRow: {
    flexDirection: 'row',
  },
  jobImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  jobTitleCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  jobTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  pricePillRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  pricePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    color: '#0084FF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  pricePeriod: {
    color: '#8E8E93',
    fontWeight: '500',
    fontSize: 12,
  },
  quickTagsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagItemLight: {
    backgroundColor: '#F4F5F7',
  },
  tagItemDark: {
    backgroundColor: '#2C2C2E',
  },
  tagIcon: {
    marginRight: 4,
  },
  tagLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  hotTagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3D00',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  hotTagLabelText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 58,
    paddingBottom: 18,
    marginBottom: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    alignItems: 'center',
  },
  heroLogoWrap: {
    position: 'absolute',
    top: -44,
    width: 88,
    height: 88,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  heroLogoImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  heroJobTitle: {
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 28,
    textAlign: 'center',
  },
  heroCompanyName: {
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    marginTop: 18,
    width: '100%',
  },
  heroMetricItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 0,
  },
  heroMetricDivider: {
    borderRightWidth: 1,
    borderRightColor: '#EEF2F7',
  },
  heroMetricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroMetricLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroMetricValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    maxWidth: '100%',
  },
  detailTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  detailTabActive: {
    paddingVertical: 12,
    marginRight: 28,
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
  },
  detailTab: {
    paddingVertical: 12,
    marginRight: 22,
  },
  detailTabActiveText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  detailTabText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '700',
  },
  infoChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  infoChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  infoChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  companyProfileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  companyProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  companyLogoLarge: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyProfileTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  companySectionEyebrow: {
    color: '#0084FF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  companyProfileName: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  companyRatingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  companyRatingText: {
    fontSize: 12,
    fontWeight: '800',
  },
  companyMutedText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  companyDetailsGrid: {
    gap: 9,
  },
  companyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
  },
  companyDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  companyDetailTextCol: {
    flex: 1,
    minWidth: 0,
  },
  companyDetailLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  companyDetailValue: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  employerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  employerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  employerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  employerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  employerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employerNameText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  employerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  statsSubtext: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8E8E93',
    marginHorizontal: 6,
  },
  employerModalContent: {
    width: '100%',
    maxHeight: '86%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
    overflow: 'hidden',
  },
  employerModalHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  employerModalHandle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  employerModalCloseButton: {
    position: 'absolute',
    top: 18,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  employerHeroCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    overflow: 'hidden',
  },
  employerHeroPattern: {
    position: 'absolute',
    top: -42,
    right: -36,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 132, 255, 0.12)',
  },
  employerModalAvatar: {
    width: 70,
    height: 70,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  employerModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 18,
  },
  employerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  employerVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  employerVerifiedText: {
    color: '#0084FF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  employerRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  employerRatingPillText: {
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4,
  },
  employerModalBody: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  employerStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  employerStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    minWidth: 0,
  },
  employerStatValue: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  employerStatLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  employerSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  employerDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#F4F5F7',
  },
  employerDetailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employerDetailTextCol: {
    flex: 1,
  },
  employerDetailLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  employerDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
  employerModalDoneButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },
  employerModalDoneText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionCard: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  bulletList: {
    gap: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  metaCard: {
    padding: 16,
    gap: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  metaIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metaTextCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
    lineHeight: 18,
  },
  scrollPaddingBottom: {
    height: 80,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  darkFooter: {
    backgroundColor: '#1C1C1E',
    borderTopColor: '#2C2C2E',
  },
  saveJobButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveJobButtonActive: {
    backgroundColor: '#0F172A',
  },
  applyButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  applyIcon: {
    marginTop: 1,
  },
  reportTextContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  reportText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  reportTextLink: {
    color: '#0F172A',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0084FF',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  modalSubtext: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  modalForm: {
    padding: 20,
  },
  formRow: {
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  reasonList: {
    gap: 12,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 34,
  },
  reasonText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  reporterInfoBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  reporterInfoRow: {
    gap: 4,
  },
  reporterInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  reporterInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  requiredStar: {
    color: '#FF3D00',
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 100,
  },
  modalButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  sendButton: {
    backgroundColor: '#0084FF',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
