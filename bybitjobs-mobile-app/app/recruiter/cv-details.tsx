import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

export default function RecruiterCvDetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { appId } = useLocalSearchParams<{ appId: string }>();
  const { applications, candidates, updateApplicationStatus } = useAuth();

  const application = applications.find((a) => a.id === appId);
  const candidate = candidates.find((c) => c.id === application?.candidateId);

  if (!candidate || !application) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerBarTitle, { color: isDark ? '#FFF' : '#000' }]}>Chi tiết hồ sơ</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={{ color: isDark ? '#FFF' : '#000' }}>Không tìm thấy thông tin hồ sơ ứng viên.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isApproved = application.status === 'Approved';

  const handleApprove = () => {
    updateApplicationStatus(application.id, 'Approved');
    Alert.alert(
      '✓ Đã duyệt hồ sơ',
      `Đã duyệt thành công hồ sơ của "${candidate.name}". Số điện thoại liên hệ đầy đủ đã được mở khóa.`
    );
  };

  const handleReject = () => {
    updateApplicationStatus(application.id, 'Rejected');
    Alert.alert(
      '✕ Đã từ chối',
      `Đã từ chối hồ sơ ứng viên. Hệ thống đã gửi tin nhắn thông báo tự động đến ứng viên.`,
      [
        {
          text: 'Về quản lý ứng viên',
          onPress: () => {
            router.replace('/recruiter/candidates');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: '#0084FF' }]}>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Chi tiết CV ứng viên</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
            <Ionicons name="share-social-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main scrolling details */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Card 1: Avatar & Personal General Details */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: candidate.avatar }} style={styles.profileAvatar} />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#0084FF" />
            </View>
          </View>

          <Text style={[styles.candidateNameText, { color: isDark ? '#FFF' : '#11181C' }]}>
            {candidate.name}
          </Text>
          <Text style={styles.candidateRoleSubtitle}>
            {candidate.role}
          </Text>

          <View style={styles.ratingBadge}>
            <Text style={styles.ratingBadgeText}>⭐️ {candidate.rating} ({candidate.reviewsCount} đánh giá)</Text>
          </View>

          {/* Contact Details List */}
          <View style={[styles.detailsDivider, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} />
          
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={16} color="#8E8E93" style={styles.contactIcon} />
            <Text style={[styles.contactValueText, { color: isDark ? '#FFF' : '#11181C' }]}>{candidate.email}</Text>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={16} color="#8E8E93" style={styles.contactIcon} />
            <Text style={[styles.contactValueText, { color: isDark ? '#FFF' : '#11181C', fontWeight: isApproved ? '700' : '500' }]}>
              {candidate.phone}
            </Text>
            {!isApproved && (
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={11} color="#FF9500" />
                <Text style={styles.lockBadgeText}>Ẩn</Text>
              </View>
            )}
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={16} color="#8E8E93" style={styles.contactIcon} />
            <Text style={[styles.contactValueText, { color: isDark ? '#FFF' : '#11181C' }]}>{candidate.location}</Text>
          </View>

          <View style={styles.contactRow}>
            <Ionicons name="time-outline" size={16} color="#8E8E93" style={styles.contactIcon} />
            <Text style={[styles.contactValueText, { color: isDark ? '#FFF' : '#11181C' }]}>{candidate.jobType}</Text>
          </View>
        </View>

        {/* Card 2: Main Skills */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>KỸ NĂNG CHÍNH</Text>
          <View style={styles.skillsWrapper}>
            {candidate.skills.map((skill, index) => (
              <View key={index} style={[styles.skillChip, { backgroundColor: isDark ? '#2C2C2E' : '#EBF5FF' }]}>
                <Text style={styles.skillChipText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Card 3: Other Profile Items */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>HỒ SƠ KHÁC</Text>
          
          <View style={styles.otherItemRow}>
            <View style={styles.otherIconBg}>
              <Ionicons name="globe-outline" size={20} color="#0084FF" />
            </View>
            <View style={styles.otherTextWrapper}>
              <Text style={styles.otherLabel}>Portfolio</Text>
              <Text style={styles.otherValueText}>{candidate.portfolio}</Text>
            </View>
          </View>

          <View style={[styles.detailsDivider, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', marginVertical: 10 }]} />

          <View style={styles.otherItemRow}>
            <View style={styles.otherIconBg}>
              <Ionicons name="school-outline" size={20} color="#0084FF" />
            </View>
            <View style={styles.otherTextWrapper}>
              <Text style={styles.otherLabel}>Học vấn</Text>
              <Text style={styles.otherValueText}>{candidate.education}</Text>
            </View>
          </View>
        </View>

        {/* Card 4: Work Experience - VERTICAL TIMELINE CHART */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>KINH NGHIỆM LÀM VIỆC</Text>
          
          <View style={styles.timelineContainer}>
            {candidate.experience.map((exp, index) => {
              const isLast = index === candidate.experience.length - 1;
              return (
                <View key={index} style={styles.timelineRow}>
                  {/* Timeline spine decoration */}
                  <View style={styles.spineColumn}>
                    <View style={[styles.timelineNode, { backgroundColor: exp.isCurrent ? '#0084FF' : '#B0C4DE' }]} />
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB' }]} />}
                  </View>

                  {/* Experience description node */}
                  <View style={styles.experienceContentWrapper}>
                    <Text style={[styles.expRoleText, { color: isDark ? '#FFF' : '#11181C' }]}>
                      {exp.role}
                    </Text>
                    <Text style={styles.expCompanyText}>
                      {exp.company} • {exp.duration}
                    </Text>
                    <Text style={[styles.expDescText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                      {exp.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Card 5: PDF Attached CV Preview */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <View style={styles.attachedCvHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C', marginBottom: 0 }]}>TỆP CV ĐÍNH KÈM</Text>
            <TouchableOpacity activeOpacity={0.7} style={styles.downloadBtn}>
              <Ionicons name="download-outline" size={14} color="#0084FF" />
              <Text style={styles.downloadBtnText}>Tải xuống PDF</Text>
            </TouchableOpacity>
          </View>

          {/* Styled Document container */}
          <View style={[styles.cvMockPreviewContainer, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}>
            <View style={styles.cvMockPaper}>
              <View style={styles.cvMockAvatarBox} />
              <View style={styles.cvMockLineLong} />
              <View style={styles.cvMockLineMedium} />
              <View style={styles.cvMockLineShort} />
              <View style={styles.cvMockBlocksRow}>
                <View style={styles.cvMockBlock} />
                <View style={styles.cvMockBlock} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.scrollPadding} />
      </ScrollView>

      {/* Sticky Bottom Actions Container */}
      <View style={[styles.stickyBottomBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderTopColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
        
        {/* Red / White Reject Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleReject}
          style={[styles.bottomBtn, styles.rejectActionBtn]}
        >
          <Ionicons name="close" size={20} color="#FF3B30" style={{ marginRight: 6 }} />
          <Text style={styles.rejectActionBtnText}>Từ chối</Text>
        </TouchableOpacity>

        {/* Blue / White Approve Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleApprove}
          style={[styles.bottomBtn, styles.approveActionBtn]}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.approveActionBtnText}>
            {isApproved ? 'Đã duyệt ứng viên' : 'Duyệt ứng viên'}
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBarTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerRightActions: {
    flexDirection: 'row',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  candidateNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  candidateRoleSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  ratingBadge: {
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  detailsDivider: {
    height: 1,
    width: '100%',
    marginVertical: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 28,
  },
  contactIcon: {
    marginRight: 10,
    width: 20,
  },
  contactValueText: {
    fontSize: 13,
  },
  lockBadge: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFD580',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 1,
    gap: 2,
    marginLeft: 8,
  },
  lockBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0084FF',
    marginBottom: 12,
    letterSpacing: 0.8,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0084FF',
  },
  otherItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherIconBg: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  otherTextWrapper: {
    flex: 1,
  },
  otherLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 2,
  },
  otherValueText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0084FF',
  },
  timelineContainer: {
    paddingLeft: 4,
    paddingTop: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 80,
  },
  spineColumn: {
    width: 24,
    alignItems: 'center',
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    position: 'absolute',
    top: 10,
    bottom: -10,
    left: 11,
  },
  experienceContentWrapper: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 20,
  },
  expRoleText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  expCompanyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0084FF',
    marginBottom: 8,
  },
  expDescText: {
    fontSize: 12,
    lineHeight: 18,
  },
  attachedCvHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadBtnText: {
    fontSize: 11,
    color: '#0084FF',
    fontWeight: '700',
  },
  cvMockPreviewContainer: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cvMockPaper: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    maxWidth: 260,
    minHeight: 180,
    borderRadius: 6,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cvMockAvatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  cvMockLineLong: {
    height: 6,
    width: '100%',
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
    borderRadius: 3,
  },
  cvMockLineMedium: {
    height: 6,
    width: '75%',
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
    borderRadius: 3,
  },
  cvMockLineShort: {
    height: 6,
    width: '45%',
    backgroundColor: '#F5F5F5',
    marginBottom: 16,
    borderRadius: 3,
  },
  cvMockBlocksRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cvMockBlock: {
    flex: 1,
    height: 40,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 4,
  },
  scrollPadding: {
    height: 30,
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 8,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectActionBtn: {
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    backgroundColor: '#FFF',
    marginRight: 12,
  },
  rejectActionBtnText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
  },
  approveActionBtn: {
    backgroundColor: '#0084FF',
  },
  approveActionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
