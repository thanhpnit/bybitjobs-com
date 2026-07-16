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
import { useAuth } from '@/hooks/use-auth';
import { db } from '../src/config/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

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
  const [reportForm, setReportForm] = useState({
    content: ''
  });

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

  const displayTitle = currentJob?.title || title || 'Nhân viên phục vụ quán cà phê The Coffee House';
  const displaySalary = currentJob?.salary || salary || '300.000đ /ngày';
  const displayLocation = currentJob?.location || location || 'The Coffee House, 123 Nguyễn Văn Lượng, Phường 17, Gò Vấp, TP.HCM';
  const displayJobId = currentJob?.id || jobId || `job-${displayTitle.trim().toLowerCase().replace(/\s+/g, '-')}`;
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
    <View style={[styles.employerDetailRow, { backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}>
      <View style={[styles.employerDetailIcon, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
        <Ionicons name={icon} size={17} color="#0084FF" />
      </View>
      <View style={styles.employerDetailTextCol}>
        <Text style={styles.employerDetailLabel}>{label}</Text>
        <Text style={[styles.employerDetailValue, { color: isDark ? '#FFF' : '#11181C' }]}>
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
          <View style={styles.headerLeft}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.brandTitle}>BybitJobs</Text>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Job Title Card */}
          <View style={[styles.whiteCard, isDark && styles.darkCard]}>
            <View style={styles.jobHeaderRow}>
              {(currentJob as any)?.image ? (
                <Image
                  source={{ uri: (currentJob as any).image }}
                  style={styles.jobImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.jobImage, { backgroundColor: isDark ? '#2C2C2E' : '#FFF3E0', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="desktop-outline" size={32} color="#FF9800" />
                </View>
              )}
              <View style={styles.jobTitleCol}>
                <Text style={[styles.jobTitleText, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {displayTitle}
                </Text>
                <View style={styles.pricePillRow}>
                  <View style={[styles.pricePill, { backgroundColor: isDark ? '#152E47' : '#E6F4FE' }]}>
                    <Text style={styles.priceText}>
                      {displaySalary}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Info Tags */}
            <View style={styles.quickTagsRow}>
              <View style={[styles.tagItem, isDark ? styles.tagItemDark : styles.tagItemLight]}>
                <Ionicons name="briefcase-outline" size={14} color={isDark ? '#9BA1A6' : '#687076'} style={styles.tagIcon} />
                <Text style={[styles.tagLabelText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                  {currentJob?.industry || 'Tuyển dụng'}
                </Text>
              </View>

              <View style={[styles.tagItem, isDark ? styles.tagItemDark : styles.tagItemLight]}>
                <Ionicons name="time-outline" size={14} color={isDark ? '#9BA1A6' : '#687076'} style={styles.tagIcon} />
                <Text style={[styles.tagLabelText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                  {currentJob?.isOpen ? 'Đang tuyển' : 'Đã đóng'}
                </Text>
              </View>

              {(currentJob as any)?.isPremium && (
                <View style={styles.hotTagItem}>
                  <Ionicons name="flame" size={14} color="#FFF" style={styles.tagIcon} />
                  <Text style={styles.hotTagLabelText}>HOT</Text>
                </View>
              )}
            </View>
          </View>

          {/* Employer Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setEmployerInfoModalVisible(true)}
            style={[styles.whiteCard, styles.employerCard, isDark && styles.darkCard]}
          >
            <View style={styles.employerLeft}>
              <Image
                source={require('../assets/images/android-icon-foreground.png')} // Custom smiling profile vector mockup
                style={[styles.employerAvatar, { backgroundColor: isDark ? '#3C3C3E' : '#E6F4FE' }]}
                resizeMode="cover"
              />
              <View style={styles.employerInfo}>
                <View style={styles.employerNameRow}>
                  <Text style={[styles.employerNameText, { color: isDark ? '#FFF' : '#11181C' }]}>
                    {employerName}
                  </Text>
                  <Ionicons name="checkmark-circle" size={16} color="#0084FF" style={styles.verifiedIcon} />
                </View>
                
                <View style={styles.employerStats}>
                  <Ionicons name="star" size={14} color="#FFB300" style={styles.starIcon} />
                  <Text style={[styles.ratingText, { color: isDark ? '#ECEDEE' : '#333' }]}>4.8</Text>
                  <Text style={styles.statsSubtext}>(124 đánh giá)</Text>
                  <View style={styles.dotSeparator} />
                  <Text style={styles.statsSubtext}>Đã tham gia 2 năm</Text>
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#9BA1A6' : '#8E8E93'} />
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
                  {currentJob?.deadline || 'Liên hệ nhà tuyển dụng'}
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

          <TouchableOpacity activeOpacity={0.85} onPress={handleApply} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Ứng tuyển ngay</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" style={styles.applyIcon} />
          </TouchableOpacity>
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
              <TouchableOpacity
                style={[styles.employerModalCloseButton, { backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}
                onPress={() => setEmployerInfoModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={isDark ? '#9BA1A6' : '#687076'} />
              </TouchableOpacity>
              <View style={styles.employerModalHandle} />
              <View style={[styles.employerHeroCard, { backgroundColor: isDark ? '#152E47' : '#EAF5FF' }]}>
                <View style={styles.employerHeroTop}>
                  <View style={[styles.employerModalAvatar, { backgroundColor: isDark ? '#1C2A3A' : '#FFFFFF' }]}>
                    <Ionicons name="business" size={34} color="#0084FF" />
                  </View>
                  <View style={styles.employerHeroTextCol}>
                    <Text style={[styles.employerModalTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={2}>
                      {employerInfo?.companyName || employerName}
                    </Text>
                    <View style={[styles.employerVerifiedPill, { backgroundColor: isDark ? '#1C2A3A' : '#FFFFFF' }]}>
                      <Ionicons name="checkmark-circle" size={13} color="#0084FF" />
                      <Text style={styles.employerVerifiedText}>Nhà tuyển dụng</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <ScrollView style={styles.employerModalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.employerSectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Thông tin liên hệ
              </Text>
              {renderEmployerInfoRow('person-outline', 'Người đại diện', employerInfo?.displayName || employerName)}
              {renderEmployerInfoRow('business-outline', 'Tên công ty', employerInfo?.companyName || employerName)}
              {renderEmployerInfoRow('call-outline', 'Số điện thoại', employerInfo?.phone)}
              {renderEmployerInfoRow('mail-outline', 'Email', employerInfo?.email)}
              {renderEmployerInfoRow('location-outline', 'Địa chỉ', employerInfo?.address)}
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

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Nội dung <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={[styles.textArea, { color: isDark ? '#FFF' : '#11181C', backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}
                  placeholder="Bạn vui lòng cung cấp rõ thông tin hoặc bằng chứng..."
                  placeholderTextColor={isDark ? '#9BA1A6' : '#9CA3AF'}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={reportForm.content}
                  onChangeText={(text) => setReportForm({...reportForm, content: text})}
                />
              </View>

              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]}
                activeOpacity={0.85}
                onPress={async () => {
                  if (!reportForm.content.trim()) {
                    Alert.alert('Thông báo', 'Vui lòng nhập nội dung báo cáo.');
                    return;
                  }

                  try {
                    await addDoc(collection(db, 'reports'), {
                      type: 'Phản ánh tin tuyển dụng',
                      desc: reportForm.content.trim(),
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
                    setReportForm({ content: '' });
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
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
    maxHeight: '76%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 34 : 22,
  },
  employerModalHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  employerModalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  employerModalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  employerHeroCard: {
    borderRadius: 20,
    padding: 16,
  },
  employerHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employerModalAvatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employerHeroTextCol: {
    flex: 1,
    paddingRight: 28,
  },
  employerModalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  employerVerifiedPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  employerVerifiedText: {
    color: '#0084FF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  employerModalBody: {
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  employerSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  employerDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    marginBottom: 9,
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
    fontWeight: '600',
    lineHeight: 21,
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
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveJobButtonActive: {
    backgroundColor: '#0084FF',
  },
  applyButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0084FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    elevation: 4,
    shadowColor: '#0084FF',
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
    color: '#0084FF',
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
