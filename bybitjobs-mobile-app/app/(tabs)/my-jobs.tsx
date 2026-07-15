import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'expo-router';
import RecruiterCandidatesScreen from '../recruiter/candidates';

function CandidateMyJobsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const {
    firebaseUser,
    applications,
    savedJobs,
    invitations,
    respondToInvitation,
    userDataExtra,
  } = useAuth();

  // Tab State: 'Applied' | 'Saved' | 'Invitations'
  const [activeTab, setActiveTab] = React.useState<'Applied' | 'Saved' | 'Invitations'>('Applied');

  // Filter applications for this candidate
  const candidateApps = React.useMemo(() => {
    if (!firebaseUser) return [];
    return applications.filter((app) => app.candidateId === firebaseUser.uid);
  }, [applications, firebaseUser]);

  // Filter invitations for this candidate (supporting mock candidate mapping for simulation/testing)
  const candidateInvites = React.useMemo(() => {
    if (!firebaseUser) return [];
    return invitations.filter(
      (inv) =>
        inv.candidateId === firebaseUser.uid ||
        inv.candidateId === 'candidate-1' ||
        inv.candidateId === 'candidate-2' ||
        inv.candidateId === 'candidate-3' ||
        inv.candidateId === 'candidate-4'
    );
  }, [invitations, firebaseUser]);

  const handleRespond = (invitationId: string, status: 'Accepted' | 'Declined', jobTitle: string) => {
    Alert.alert(
      status === 'Accepted' ? 'Đồng ý nhận việc?' : 'Từ chối lời mời?',
      status === 'Accepted'
        ? `Bạn có chắc chắn muốn chấp nhận lời mời ứng tuyển công việc "${jobTitle}"? Hệ thống sẽ tự động nộp hồ sơ của bạn.`
        : `Bạn có muốn từ chối lời mời ứng tuyển công việc "${jobTitle}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: status === 'Accepted' ? 'Chấp nhận' : 'Từ chối',
          style: status === 'Accepted' ? 'default' : 'destructive',
          onPress: async () => {
            const res = await respondToInvitation(invitationId, status);
            if (res.success) {
              Alert.alert('Thành công', res.message);
            } else {
              Alert.alert('Lỗi', res.message);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Accepted':
        return { text: '#2E7D32', bg: '#E8F5E9' };
      case 'Rejected':
      case 'Declined':
        return { text: '#C62828', bg: '#FFEBEE' };
      default:
        return { text: '#FF8F00', bg: '#FFF8E1' };
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'Approved': return 'Đã duyệt';
      case 'Rejected': return 'Từ chối';
      case 'Pending': return 'Đang chờ';
      case 'Accepted': return 'Đã chấp nhận';
      case 'Declined': return 'Đã từ chối';
      default: return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Header */}
      <View style={[styles.headerBar, { backgroundColor: '#0084FF' }]}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Việc của tôi</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/notifications')}
          style={styles.notifBtn}
        >
          <Ionicons name="notifications-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBarContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('Applied')}
          style={[styles.tabButton, activeTab === 'Applied' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'Applied' ? styles.tabTextActive : { color: isDark ? '#9BA1A6' : '#687076' }]}>
            Đã nộp ({candidateApps.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('Saved')}
          style={[styles.tabButton, activeTab === 'Saved' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'Saved' ? styles.tabTextActive : { color: isDark ? '#9BA1A6' : '#687076' }]}>
            Đã lưu ({savedJobs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveTab('Invitations')}
          style={[styles.tabButton, activeTab === 'Invitations' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabText, activeTab === 'Invitations' ? styles.tabTextActive : { color: isDark ? '#9BA1A6' : '#687076' }]}>
            Lời mời ({candidateInvites.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scroll View Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!firebaseUser ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1C1C1E' : '#E6F4FE' }]}>
              <Ionicons name="lock-closed-outline" size={44} color="#0084FF" />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
              Yêu cầu đăng nhập
            </Text>
            <Text style={styles.emptySubtitle}>
              Vui lòng đăng nhập để xem các công việc đã lưu, đã ứng tuyển và các lời mời làm việc từ nhà tuyển dụng.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push('/login')}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'Applied' ? (
          candidateApps.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={48} color="#8E8E93" />
              <Text style={[styles.emptyText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                Bạn chưa nộp hồ sơ ứng tuyển công việc nào.
              </Text>
            </View>
          ) : (
            candidateApps.map((app) => {
              const statusStyle = getStatusColor(app.status);
              return (
                <View
                  key={app.id}
                  style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.titleCol}>
                      <Text style={[styles.jobTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                        {app.jobTitle}
                      </Text>
                      <Text style={styles.companyName}>{app.companyName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {translateStatus(app.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    {app.jobSalary && (
                      <Text style={styles.metaText}>💰 Lương: {app.jobSalary}</Text>
                    )}
                    {app.jobLocation && (
                      <Text style={styles.metaText}>📍 {app.jobLocation}</Text>
                    )}
                  </View>

                  <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} />

                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>Nộp ngày: {formatDate(app.appliedAt)}</Text>
                    {app.cvName && (
                      <Text style={styles.cvText} numberOfLines={1}>📄 {app.cvName}</Text>
                    )}
                  </View>
                </View>
              );
            })
          )
        ) : activeTab === 'Saved' ? (
          savedJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={48} color="#8E8E93" />
              <Text style={[styles.emptyText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                Bạn chưa lưu công việc nào.
              </Text>
            </View>
          ) : (
            savedJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                activeOpacity={0.9}
                onPress={() => {
                  router.push({
                    pathname: '/job-details',
                    params: {
                      jobId: job.jobId,
                      title: job.jobTitle,
                      salary: job.jobSalary,
                      location: job.jobLocation,
                    },
                  });
                }}
                style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleCol}>
                    <Text style={[styles.jobTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                      {job.jobTitle}
                    </Text>
                    <Text style={styles.metaText}>📍 {job.jobLocation || 'Chưa cập nhật'}</Text>
                  </View>
                  <Ionicons name="bookmark" size={22} color="#0084FF" />
                </View>
                <View style={styles.metaRow}>
                  {job.jobSalary && (
                    <Text style={[styles.metaText, { color: '#0084FF', fontWeight: 'bold' }]}>
                      💰 {job.jobSalary}
                    </Text>
                  )}
                  <Text style={styles.dateText}>Lưu ngày: {formatDate(job.savedAt)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : (
          candidateInvites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-open-outline" size={48} color="#8E8E93" />
              <Text style={[styles.emptyText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                Bạn chưa nhận được lời mời làm việc nào.
              </Text>
            </View>
          ) : (
            candidateInvites.map((invite) => {
              const statusStyle = getStatusColor(invite.status);
              return (
                <View
                  key={invite.id}
                  style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.titleCol}>
                      <Text style={[styles.jobTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                        {invite.jobTitle}
                      </Text>
                      <Text style={styles.companyName}>🏢 {invite.companyName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {translateStatus(invite.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.inviteDesc, { color: isDark ? '#AAA' : '#687076' }]}>
                    Nhà tuyển dụng đã gửi lời mời bạn ứng tuyển và đánh giá hồ sơ cho vị trí này.
                  </Text>

                  <View style={styles.dateRow}>
                    <Text style={styles.dateText}>Nhận lúc: {formatDate(invite.createdAt)}</Text>
                  </View>

                  {invite.status === 'Pending' && (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRespond(invite.id, 'Declined', invite.jobTitle)}
                        style={[styles.actionBtn, styles.declineBtn, { borderColor: isDark ? '#444' : '#E5E7EB' }]}
                      >
                        <Text style={styles.declineBtnText}>✕ Từ chối</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleRespond(invite.id, 'Accepted', invite.jobTitle)}
                        style={[styles.actionBtn, styles.acceptBtn]}
                      >
                        <Text style={styles.acceptBtnText}>✓ Đồng ý</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
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
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notifBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
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
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0084FF',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    marginRight: 8,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 12,
    color: '#0084FF',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  cvText: {
    fontSize: 11,
    color: '#0084FF',
    maxWidth: '60%',
  },
  inviteDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  dateRow: {
    marginTop: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 14,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtn: {
    backgroundColor: 'transparent',
  },
  declineBtnText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: 'bold',
  },
  acceptBtn: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  acceptBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  loginButton: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default function MyJobsScreen() {
  const { userRole } = useAuth();
  if (userRole === 'employer') {
    return <RecruiterCandidatesScreen />;
  }
  return <CandidateMyJobsScreen />;
}
