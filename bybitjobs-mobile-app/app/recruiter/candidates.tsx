import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth, ApplicationItem, CandidateItem } from '@/hooks/use-auth';

export default function RecruiterCandidatesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { applications, candidates, jobs, updateApplicationStatus } = useAuth();

  // Tab state: 'All' | 'Pending' | 'Approved' | 'Rejected'
  const [activeTab, setActiveTab] = React.useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  // Filter application records
  const filteredApps = applications.filter((app) => {
    if (activeTab === 'Pending') return app.status === 'Pending';
    if (activeTab === 'Approved') return app.status === 'Approved';
    if (activeTab === 'Rejected') return app.status === 'Rejected';
    return true;
  });

  const handleApprove = (appId: string, candidateName: string) => {
    updateApplicationStatus(appId, 'Approved');
    Alert.alert(
      '✓ Đã duyệt hồ sơ',
      `Đã duyệt hồ sơ của ứng viên "${candidateName}". Hệ thống đã mở khóa thông tin liên hệ đầy đủ.`
    );
  };

  const handleReject = (appId: string, candidateName: string) => {
    updateApplicationStatus(appId, 'Rejected');
    Alert.alert(
      '✕ Đã từ chối',
      `Hệ thống đã cập nhật trạng thái Từ chối cho ứng viên "${candidateName}" và gửi thông báo tự động.`
    );
  };

  const getRelativeTimeLabel = (appliedAtString: string) => {
    const appliedAt = new Date(appliedAtString);
    const now = new Date();
    const diffMs = now.getTime() - appliedAt.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffDays <= 0) return 'HÔM NAY';
    if (diffDays === 1) return 'HÔM QUA';
    return `${diffDays} NGÀY TRƯỚC`;
  };

  const pendingCount = applications.filter((a) => a.status === 'Pending').length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
      {/* Header bar */}
      <View style={[styles.headerBar, { backgroundColor: '#0084FF' }]}>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Quản lý ứng viên</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.push('/recruiter/dashboard')}>
          <Ionicons name="desktop-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Title block */}
      <View style={[styles.subHeader, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
        <Text style={[styles.subHeaderTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
          Danh sách hồ sơ nộp
        </Text>
        <Text style={styles.subHeaderDesc}>
          Hiện có {pendingCount} hồ sơ đang chờ xử lý.
        </Text>
      </View>

      {/* 4 Navigation filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsScroll, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}
        contentContainerStyle={styles.tabsScrollContent}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('All')}
          style={[styles.tabButton, activeTab === 'All' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'All' ? styles.tabTextActive : { color: isDark ? '#9BA1A6' : '#687076' }]}>
            Tất cả ({applications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('Pending')}
          style={[styles.tabButton, activeTab === 'Pending' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'Pending' ? styles.tabTextActive : { color: isDark ? '#9BA1A6' : '#687076' }]}>
            Chờ duyệt ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('Approved')}
          style={[styles.tabButton, activeTab === 'Approved' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'Approved' ? styles.tabTextActive : { color: isDark ? '#9BA1A6' : '#687076' }]}>
            Đã duyệt ({applications.filter((a) => a.status === 'Approved').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('Rejected')}
          style={[styles.tabButton, activeTab === 'Rejected' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'Rejected' ? styles.tabTextActive : { color: isDark ? '#9BA1A6' : '#687076' }]}>
            Từ chối ({applications.filter((a) => a.status === 'Rejected').length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Main scrolling content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredApps.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#8E8E93" />
            <Text style={[styles.emptyText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
              Không tìm thấy hồ sơ ứng viên phù hợp.
            </Text>
          </View>
        ) : (
          filteredApps.map((app) => {
            const candidate = candidates.find((c) => c.id === app.candidateId);
            const job = jobs.find((j) => j.id === app.jobId);
            if (!candidate) return null;

            return (
              <TouchableOpacity
                key={app.id}
                activeOpacity={0.9}
                onPress={() => router.push({
                  pathname: '/recruiter/cv-details',
                  params: { appId: app.id }
                })}
                style={[
                  styles.candidateCard,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
                  },
                ]}
              >
                {/* Upper row: Avatar & Profile Info */}
                <View style={styles.cardHeader}>
                  <Image source={{ uri: candidate.avatar }} style={styles.avatar} />
                  <View style={styles.infoWrapper}>
                    <Text style={[styles.candidateName, { color: isDark ? '#FFF' : '#11181C' }]}>
                      {candidate.name}
                    </Text>
                    <Text style={styles.candidateDetails}>
                      ⭐️ {candidate.rating} • {candidate.role}
                    </Text>
                    {job && (
                      <Text style={styles.jobAppliedTitle} numberOfLines={1}>
                        Ứng tuyển: {job.title}
                      </Text>
                    )}
                  </View>

                  {/* Relative date indicator badge */}
                  <View style={styles.badgeWrapper}>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>
                        {getRelativeTimeLabel(app.appliedAt)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Direct quick action buttons inside Pending card */}
                {app.status === 'Pending' && (
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleReject(app.id, candidate.name)}
                      style={[styles.actionBtn, styles.rejectBtn, { borderColor: isDark ? '#444' : '#E5E7EB' }]}
                    >
                      <Ionicons name="close-circle-outline" size={16} color="#FF3B30" />
                      <Text style={styles.rejectBtnText}>✕ Từ chối</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleApprove(app.id, candidate.name)}
                      style={[styles.actionBtn, styles.approveBtn]}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#0084FF" />
                      <Text style={styles.approveBtnText}>✓ Duyệt hồ sơ</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Show status label if already processed */}
                {app.status !== 'Pending' && (
                  <View style={[styles.statusBanner, { backgroundColor: app.status === 'Approved' ? '#EBFDF5' : '#FDF2F2' }]}>
                    <Ionicons 
                      name={app.status === 'Approved' ? 'checkmark-circle' : 'close-circle'} 
                      size={14} 
                      color={app.status === 'Approved' ? '#10B981' : '#EF4444'} 
                    />
                    <Text style={[styles.statusBannerText, { color: app.status === 'Approved' ? '#10B981' : '#EF4444' }]}>
                      {app.status === 'Approved' ? 'Đã duyệt ứng viên' : 'Đã từ chối hồ sơ'}
                    </Text>
                  </View>
                )}

              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Simulator Raised FAB Bottom Navigation Bar */}
      <View style={[styles.bottomNavBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/dashboard')} style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/jobs')} style={styles.navItem}>
          <Ionicons name="briefcase-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Việc của tôi</Text>
        </TouchableOpacity>

        {/* Center Raised FAB */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push({ pathname: '/recruiter/edit-job', params: { id: 'new' } })} style={styles.fabNavItem}>
          <View style={[styles.fabCircle, { backgroundColor: '#0060B6', borderColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <Ionicons name="add" size={32} color="#FFF" />
          </View>
          <Text style={styles.fabItemText}>Đăng tin</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/candidates')} style={styles.navItem}>
          <Ionicons name="people" size={24} color="#0084FF" />
          <Text style={[styles.navItemText, { color: '#0084FF' }]}>Cộng đồng</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/profile')} style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Cá nhân</Text>
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  subHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  subHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subHeaderDesc: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tabsScroll: {
    maxHeight: 46,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsScrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    height: '100%',
  },
  tabButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#0084FF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#0084FF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  candidateCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  infoWrapper: {
    flex: 1,
    paddingRight: 6,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  candidateDetails: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 3,
  },
  jobAppliedTitle: {
    fontSize: 11,
    color: '#0084FF',
    fontWeight: '600',
  },
  badgeWrapper: {
    justifyContent: 'center',
  },
  timeBadge: {
    backgroundColor: '#E6F4FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0084FF',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  rejectBtn: {
    borderWidth: 1,
    backgroundColor: '#FFF',
  },
  rejectBtnText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: 'bold',
  },
  approveBtn: {
    backgroundColor: '#EBF5FF',
  },
  approveBtnText: {
    color: '#0084FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    borderRadius: 8,
    marginTop: 12,
  },
  statusBannerText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  bottomNavBar: {
    height: 64,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    overflow: 'visible',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  navItemText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 4,
  },
  fabNavItem: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  fabCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -25,
    borderWidth: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  fabItemText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0060B6',
    marginTop: 34,
  },
});
