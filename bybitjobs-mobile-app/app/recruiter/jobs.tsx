import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth, JobItem, getRelativeTime } from '@/hooks/use-auth';

export default function RecruiterJobsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { jobs, deleteJob } = useAuth();

  // Selected tab state: 'All' | 'Open' | 'Closed'
  const [activeTab, setActiveTab] = React.useState<'All' | 'Open' | 'Closed'>('All');

  // Filter jobs based on active tab
  const filteredJobs = jobs.filter((job) => {
    if (activeTab === 'Open') return job.isOpen;
    if (activeTab === 'Closed') return !job.isOpen;
    return true;
  });

  const handleEditJob = (jobId: string) => {
    router.push({
      pathname: '/recruiter/edit-job',
      params: { id: jobId },
    });
  };

  const handleDeleteJob = (jobId: string, title: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa vĩnh viễn bài đăng tuyển dụng "${title}" này không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa bài',
          style: 'destructive',
          onPress: () => {
            deleteJob(jobId);
            Alert.alert('Thành công', 'Đã xóa bài đăng tuyển dụng thành công.');
          },
        },
      ]
    );
  };

  const getJobIcon = (industry: string) => {
    switch (industry) {
      case 'Thiết kế đồ họa':
        return { name: 'brush-outline', color: '#0084FF', bg: '#E6F4FE' };
      case 'Vận chuyển':
        return { name: 'navigate-outline', color: '#FF9500', bg: '#FFF9E6' };
      case 'Dịch vụ gia đình':
        return { name: 'home-outline', color: '#34C759', bg: '#EBFDF5' };
      case 'Công nghệ thông tin':
        return { name: 'code-working-outline', color: '#AF52DE', bg: '#F5E6FE' };
      default:
        return { name: 'briefcase-outline', color: '#8E8E93', bg: '#F2F2F7' };
    }
  };

  const activeJobsCount = jobs.filter((j) => j.isOpen).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: '#0084FF' }]}>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Quản lý tuyển dụng</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.push('/recruiter/dashboard')}>
          <Ionicons name="desktop-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Subheader info text */}
      <View style={[styles.subHeader, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
        <Text style={[styles.subHeaderTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
          Quản lý bài đăng tuyển
        </Text>
        <Text style={styles.subHeaderDesc}>
          Bạn đang có {activeJobsCount} tin đăng hoạt động.
        </Text>
      </View>

      {/* 3 Tab Filters */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('All')}
          style={[
            styles.tabButton,
            activeTab === 'All' && styles.tabButtonActive,
          ]}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'All' ? styles.tabTextActive : { color: isDark ? '#9BA1A6' : '#687076' }
          ]}>
            Tất cả ({jobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('Open')}
          style={[
            styles.tabButton,
            activeTab === 'Open' && styles.tabButtonActive,
          ]}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Open' ? styles.tabTextActive : { color: isDark ? '#9BA1A6' : '#687076' }
          ]}>
            Đang mở ({activeJobsCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('Closed')}
          style={[
            styles.tabButton,
            activeTab === 'Closed' && styles.tabButtonActive,
          ]}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Closed' ? styles.tabTextActive : { color: isDark ? '#9BA1A6' : '#687076' }
          ]}>
            Đã đóng ({jobs.length - activeJobsCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main List ScrollView */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={48} color="#8E8E93" />
            <Text style={[styles.emptyText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
              Không có bài viết tuyển dụng nào trong danh sách.
            </Text>
          </View>
        ) : (
          filteredJobs.map((job) => {
            const iconDetails = getJobIcon(job.industry);
            return (
              <View
                key={job.id}
                style={[
                  styles.jobCard,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
                  },
                ]}
              >
                {/* Upper row: Icon, text info and status tag */}
                <View style={styles.cardUpperRow}>
                  {/* Square rounded left icon */}
                  <View style={[styles.iconWrapper, { backgroundColor: iconDetails.bg }]}>
                    <Ionicons name={iconDetails.name as any} size={22} color={iconDetails.color} />
                  </View>

                  {/* Title & relative date info */}
                  <View style={styles.titleWrapper}>
                    <Text style={[styles.jobTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                      {job.title}
                    </Text>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={13} color="#8E8E93" style={{ marginRight: 3 }} />
                      <Text style={styles.relativeTimeText}>
                        {getRelativeTime(job.createdAt, job.isOpen)}
                      </Text>
                    </View>
                  </View>

                  {/* Right hand status tag badge */}
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: job.isOpen ? '#0084FF' : '#E5E7EB' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: job.isOpen ? '#FFF' : '#687076' }
                    ]}>
                      {job.isOpen ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                    </Text>
                  </View>
                </View>

                {/* Bottom divider line */}
                <View style={[styles.cardDivider, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} />

                {/* Card footer: Edit and Delete buttons */}
                <View style={styles.cardFooterActions}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleEditJob(job.id)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="create-outline" size={16} color="#0084FF" />
                    <Text style={[styles.actionButtonText, { color: '#0084FF' }]}>Sửa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleDeleteJob(job.id, job.title)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                    <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button to post new mock job */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push({
          pathname: '/recruiter/edit-job',
          params: { id: 'new' }
        })}
        style={styles.fab}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Simulator Raised FAB Bottom Navigation Bar */}
      <View style={[styles.bottomNavBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/dashboard')} style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/jobs')} style={styles.navItem}>
          <Ionicons name="briefcase" size={24} color="#0084FF" />
          <Text style={[styles.navItemText, { color: '#0084FF' }]}>Việc của tôi</Text>
        </TouchableOpacity>

        {/* Center Raised FAB */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push({ pathname: '/recruiter/edit-job', params: { id: 'new' } })} style={styles.fabNavItem}>
          <View style={[styles.fabCircle, { backgroundColor: '#0060B6', borderColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <Ionicons name="add" size={32} color="#FFF" />
          </View>
          <Text style={styles.fabItemText}>Đăng tin</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/candidates')} style={styles.navItem}>
          <Ionicons name="people-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Cộng đồng</Text>
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
  tabBar: {
    flexDirection: 'row',
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  jobCard: {
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
  cardUpperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 6,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relativeTimeText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 76,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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
