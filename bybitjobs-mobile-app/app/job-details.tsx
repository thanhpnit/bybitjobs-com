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

export default function JobDetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { isLoggedIn, jobs, savedJobs, toggleSavedJob, addViewedJob } = useAuth();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [employerName, setEmployerName] = useState('Nhà tuyển dụng');
  const [reportForm, setReportForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    email: '',
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
      if (typeof storedPosterName === 'string' && storedPosterName.trim()) {
        if (isActive) setEmployerName(storedPosterName.trim());
        return;
      }

      if (!currentJob?.employerId) {
        if (isActive) setEmployerName('Nhà tuyển dụng');
        return;
      }

      try {
        const userResponse = await fetch(`http://160.250.246.119:4000/api/users/${currentJob.employerId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const userName = getFirstText(
            userData.fullName,
            userData.full_name,
            userData.displayName,
            userData.name
          );

          if (userName) {
            if (isActive) setEmployerName(userName);
            return;
          }
        }

        const employerSnapshot = await getDoc(doc(db, 'employers', currentJob.employerId));
        const employerData = employerSnapshot.exists() ? employerSnapshot.data() : null;
        const name = getFirstText(
          employerData?.posterName,
          employerData?.fullName,
          employerData?.contactName,
          employerData?.ownerName,
          employerData?.name,
          employerData?.companyName
        ) || 'Nhà tuyển dụng';

        if (isActive) setEmployerName(name);
      } catch (error) {
        console.error('Lỗi lấy thông tin nhà tuyển dụng:', error);
        if (isActive) setEmployerName('Nhà tuyển dụng');
      }
    };

    loadEmployerName();

    return () => {
      isActive = false;
    };
  }, [currentJob?.employerId, storedPosterName]);

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
    } else {
      router.push({
        pathname: '/apply-job',
        params: {
          title: displayTitle,
          jobId: displayJobId,
          salary: displaySalary,
          location: displayLocation,
        }
      });
    }
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
              <Image
                source={require('../assets/images/wedding_banquet.png')}
                style={styles.jobImage}
                resizeMode="cover"
              />
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
                <Ionicons name="time-outline" size={14} color={isDark ? '#9BA1A6' : '#687076'} style={styles.tagIcon} />
                <Text style={[styles.tagLabelText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                  Bán thời gian
                </Text>
              </View>

              <View style={[styles.tagItem, isDark ? styles.tagItemDark : styles.tagItemLight]}>
                <Ionicons name="people-outline" size={14} color={isDark ? '#9BA1A6' : '#687076'} style={styles.tagIcon} />
                <Text style={[styles.tagLabelText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                  Cần 5 người
                </Text>
              </View>

              <View style={styles.hotTagItem}>
                <Ionicons name="flame" size={14} color="#FFF" style={styles.tagIcon} />
                <Text style={styles.hotTagLabelText}>Tuyển gấp</Text>
              </View>
            </View>
          </View>

          {/* Employer Card */}
          <View style={[styles.whiteCard, styles.employerCard, isDark && styles.darkCard]}>
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
          </View>

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
              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Hỗ trợ setup bàn tiệc, sắp xếp chén đĩa theo tiêu chuẩn nhà hàng.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Phục vụ đồ ăn, thức uống cho khách tại bàn trong suốt buổi tiệc.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Dọn dẹp bàn tiệc sau khi khách dùng xong.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Hỗ trợ các công việc khác theo sự phân công của quản lý sảnh.
                </Text>
              </View>
            </View>
          </View>

          {/* Requirements (Yêu cầu) */}
          <View style={[styles.whiteCard, styles.sectionCard, isDark && styles.darkCard]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="checkbox-outline" size={20} color="#0084FF" style={styles.sectionHeaderIcon} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Yêu cầu
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Nam/Nữ từ 18 - 30 tuổi, sức khỏe tốt.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Nhanh nhẹn, trung thực, có trách nhiệm trong công việc.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Không yêu cầu kinh nghiệm (sẽ được hướng dẫn trước khi làm).
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Trang phục: Quần tây đen, áo sơ mi trắng dài tay, giày tây đen (nam) hoặc giày búp bê đen (nữ).
                </Text>
              </View>
            </View>
          </View>

          {/* Benefits (Quyền lợi) */}
          <View style={[styles.whiteCard, styles.sectionCard, isDark && styles.darkCard]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="gift-outline" size={20} color="#0084FF" style={styles.sectionHeaderIcon} />
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Quyền lợi
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Bao ăn 1 bữa giữa ca.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Thanh toán tiền mặt hoặc chuyển khoản ngay sau khi xong tiệc.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Có tiền tip nếu phục vụ tốt.
                </Text>
              </View>

              <View style={styles.bulletItem}>
                <View style={[styles.bulletDot, { backgroundColor: isDark ? '#FFF' : '#555' }]} />
                <Text style={[styles.bulletText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                  Môi trường làm việc năng động, chuyên nghiệp.
                </Text>
              </View>
            </View>
          </View>

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

            {/* Time */}
            <View style={styles.metaRow}>
              <View style={[styles.metaIconCircle, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="calendar" size={16} color="#0084FF" />
              </View>
              <View style={styles.metaTextCol}>
                <Text style={[styles.metaLabel, { color: isDark ? '#9BA1A6' : '#687076' }]}>Thời gian làm việc</Text>
                <Text style={[styles.metaValue, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Thứ 7 (15/10/2023) - Ca chiều: 14:00 đến 22:00
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
                  Trước 12:00 ngày 14/10/2023
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

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Họ và tên <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFF' : '#11181C', backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor={isDark ? '#9BA1A6' : '#9CA3AF'}
                  value={reportForm.fullName}
                  onChangeText={(text) => setReportForm({...reportForm, fullName: text})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Số điện thoại <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFF' : '#11181C', backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}
                  placeholder="0123xxxxxxx"
                  placeholderTextColor={isDark ? '#9BA1A6' : '#9CA3AF'}
                  keyboardType="phone-pad"
                  value={reportForm.phone}
                  onChangeText={(text) => setReportForm({...reportForm, phone: text})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Địa chỉ <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFF' : '#11181C', backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}
                  placeholder="Nhập địa chỉ"
                  placeholderTextColor={isDark ? '#9BA1A6' : '#9CA3AF'}
                  value={reportForm.address}
                  onChangeText={(text) => setReportForm({...reportForm, address: text})}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: isDark ? '#FFF' : '#11181C' }]}>Địa chỉ email <Text style={styles.requiredStar}>*</Text></Text>
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFF' : '#11181C', backgroundColor: isDark ? '#2C2C2E' : '#F4F5F7' }]}
                  placeholder="Nhập email"
                  placeholderTextColor={isDark ? '#9BA1A6' : '#9CA3AF'}
                  keyboardType="email-address"
                  value={reportForm.email}
                  onChangeText={(text) => setReportForm({...reportForm, email: text})}
                />
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
                  try {
                    await addDoc(collection(db, 'reports'), {
                      type: 'Phản ánh tin tuyển dụng',
                      desc: reportForm.content,
                      target: displayTitle,
                      targetBy: `Họ tên: ${reportForm.fullName} - SĐT: ${reportForm.phone} - Email: ${reportForm.email}`,
                      address: reportForm.address,
                      status: 'pending',
                      createdAt: serverTimestamp()
                    });
                    Alert.alert('Thành công', 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xử lý sớm nhất.');
                    setReportModalVisible(false);
                    setReportForm({ fullName: '', phone: '', address: '', email: '', content: '' });
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
