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
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';



export default function RecruiterDashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { employerData, jobs, logout } = useAuth();

  const [isMenuVisible, setIsMenuVisible] = React.useState(false);
  const handleOpenMenu = () => setIsMenuVisible(true);
  const handleCloseMenu = () => setIsMenuVisible(false);

  const handlePostJob = () => {
    router.push({
      pathname: '/recruiter/edit-job',
      params: { id: 'new' },
    });
  };

  const handleEditProfile = () => {
    router.push('/recruiter/profile');
  };

  const handleSelectPlan = () => {
    router.push('/recruiter/pricing');
  };

  const handleNavItemPress = (item: string) => {
    if (item === 'Cá nhân') {
      Alert.alert(
        'Đăng xuất',
        'Bạn có muốn thoát khỏi tài khoản Nhà tuyển dụng và quay lại màn hình Cá nhân của người tìm việc không?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Đăng xuất',
            style: 'destructive',
            onPress: () => {
              logout();
              router.dismissAll();
            },
          },
        ]
      );
    } else if (item === 'Trang chủ') {
      router.push('/recruiter/dashboard');
    } else if (item === 'Việc của tôi') {
      router.push('/recruiter/jobs');
    } else if (item === 'Cộng đồng') {
      router.push('/recruiter/candidates');
    } else if (item === 'Tìm kiếm') {
      router.push('/recruiter/search-candidates');
    } else {
      Alert.alert('Chuyển tab', `Đang chuyển hướng sang phân hệ: ${item}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: '#0084FF' }]}>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={handleOpenMenu}>
          <Ionicons name="menu-outline" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>BybitJobs</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner with profile box section */}
        <View style={styles.bannerHeroSection}>
          <Image
            source={require('../../assets/images/small_jobs_banner.png')}
            style={styles.bannerHeroImage}
            resizeMode="cover"
          />

          {/* Overlapping Profile card */}
          <View style={[styles.profileCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', shadowColor: '#000' }]}>
            {/* Centered circular logo box */}
            <View style={[styles.logoCircleWrapper, { borderColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              <View style={styles.logoCircular}>
                <Ionicons name="diamond" size={26} color="#0084FF" />
              </View>
            </View>

            {/* Company Info */}
            <View style={styles.companyInfoBlock}>
              <View style={styles.companyNameRow}>
                <Text style={[styles.companyName, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {employerData?.companyName || 'Công ty TNHH Giao Hàng Nhanh'}
                </Text>
                <Ionicons name="checkmark-circle" size={18} color="#0084FF" style={styles.verifiedIcon} />
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#8E8E93" />
                <Text style={styles.locationText}>
                  {employerData?.address || 'Quận 7, TP. Hồ Chí Minh'}
                </Text>
              </View>
            </View>

            {/* Statistics row Grid 3 columns */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: isDark ? '#2C2C2E' : '#F0F4F8' }]}>
                <Text style={styles.statCount}>12</Text>
                <Text style={styles.statLabel}>Tin đã đăng</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: isDark ? '#2C2C2E' : '#F0F4F8' }]}>
                <Text style={styles.statCount}>8</Text>
                <Text style={styles.statLabel}>Đang tuyển</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: isDark ? '#2C2C2E' : '#F0F4F8' }]}>
                <Text style={styles.statCount}>150+</Text>
                <Text style={styles.statLabel}>Ứng viên</Text>
              </View>
            </View>

            {/* Post Job CTA button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePostJob}
              style={styles.postJobBtn}
            >
              <Ionicons name="add-circle" size={18} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={styles.postJobBtnText}>Đăng tin tuyển dụng mới</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section title for Jobs list */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Việc làm đã đăng</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleEditProfile}>
            <Text style={styles.seeAllText}>Chỉnh sửa HS</Text>
          </TouchableOpacity>
        </View>

        {/* Job listings container */}
        <View style={styles.jobsContainer}>
          {jobs.map((job) => (
            <View
              key={job.id}
              style={[
                styles.jobCard,
                { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' },
              ]}
            >
              {/* Row 1: Title and Tag status */}
              <View style={styles.jobCardHeader}>
                <Text style={[styles.jobTitleText, { color: isDark ? '#FFF' : '#11181C' }]}>{job.title}</Text>

                <View style={[styles.statusBadge, { backgroundColor: job.isOpen ? '#EBFDF5' : '#F3F4F6' }]}>
                  <Text style={[styles.statusText, { color: job.isOpen ? '#10B981' : '#6B7280' }]}>
                    {job.isOpen ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                  </Text>
                </View>
              </View>

              {/* Row 2: Clock details */}
              <View style={styles.jobDetailsRow}>
                <Ionicons name="time-outline" size={13} color="#8E8E93" />
                <Text style={styles.jobDetailText}>{job.type || 'Toàn thời gian'}</Text>
                <Text style={styles.bulletPoint}>•</Text>
                <Ionicons name="people-outline" size={13} color="#8E8E93" />
                <Text style={styles.jobDetailText}>Cần {job.requiredCount || 1} người</Text>
              </View>

              {/* Row 3: Avatars and salary badge */}
              <View style={styles.jobCardFooter}>
                {/* Overlapping candidate avatars */}
                <View style={styles.avatarOverlapContainer}>
                  <View style={[styles.avatarBubble, { backgroundColor: '#ECEFF1', left: 0 }]} />
                  <View style={[styles.avatarBubble, { backgroundColor: '#CFD8DC', left: 14 }]} />
                  <View style={[styles.avatarCounter, { backgroundColor: '#EBF5FF', left: 28 }]}>
                    <Text style={styles.avatarCounterText}>+{job.applicantsCount || 0}</Text>
                  </View>
                </View>

                {/* Highly styled Salary Text */}
                <Text style={styles.salaryText}>{job.salary}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Dynamic packages helper card */}
        <View style={[styles.upgradePlanPromoCard, { backgroundColor: isDark ? '#1C1C1E' : '#EBF5FF', borderColor: isDark ? '#2C2C2E' : '#BFDBFE' }]}>
          <Ionicons name="ribbon-outline" size={24} color="#0084FF" />
          <View style={styles.promoTextGroup}>
            <Text style={[styles.promoTitle, { color: isDark ? '#FFF' : '#0F47A1' }]}>Gói dịch vụ hiện tại: {employerData?.currentPackage || 'Miễn phí'}</Text>
            <Text style={[styles.promoDesc, { color: isDark ? '#9BA1A6' : '#1976D2' }]}>Nâng cấp lên gói VIP để mở rộng hạn mức đăng tin tuyển dụng.</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} onPress={handleSelectPlan} style={styles.promoBuyBtn}>
            <Text style={styles.promoBuyBtnText}>Nâng cấp</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scrollSpacer} />
      </ScrollView>

      {/* Simulator Bottom Navigation Bar */}
      <View style={[styles.bottomNavBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleNavItemPress('Trang chủ')} style={styles.navItem}>
          <Ionicons name="home-outline" size={22} color="#8E8E93" />
          <Text style={styles.navItemText}>Trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => handleNavItemPress('Việc của tôi')} style={styles.navItem}>
          <Ionicons name="briefcase-outline" size={22} color="#8E8E93" />
          <Text style={styles.navItemText}>Việc của tôi</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => handleNavItemPress('Cộng đồng')} style={styles.navItem}>
          <Ionicons name="people-outline" size={22} color="#8E8E93" />
          <Text style={styles.navItemText}>Cộng đồng</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => handleNavItemPress('Cá nhân')} style={styles.navItem}>
          <Ionicons name="person" size={22} color="#0084FF" />
          <Text style={[styles.navItemText, { color: '#0084FF' }]}>Cá nhân</Text>
        </TouchableOpacity>
      </View>

      {/* Hamburger Bottom Sheet Menu */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <TouchableWithoutFeedback onPress={handleCloseMenu}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.menuSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
                <View style={styles.menuSheetHeader}>
                  <Text style={[styles.menuSheetTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Tùy chọn</Text>
                  <TouchableOpacity onPress={handleCloseMenu}>
                    <Ionicons name="close" size={24} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.menuItem} onPress={() => { handleCloseMenu(); router.push('/recruiter/profile'); }}>
                  <Ionicons name="business-outline" size={22} color={isDark ? '#FFF' : '#11181C'} />
                  <Text style={[styles.menuItemText, { color: isDark ? '#FFF' : '#11181C' }]}>Thông tin công ty</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => { handleCloseMenu(); router.push('/recruiter/transactions' as any); }}>
                  <Ionicons name="receipt-outline" size={22} color={isDark ? '#FFF' : '#11181C'} />
                  <Text style={[styles.menuItemText, { color: isDark ? '#FFF' : '#11181C' }]}>Lịch sử giao dịch</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => { handleCloseMenu(); handleNavItemPress('Cá nhân'); }}>
                  <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                  <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Đăng xuất</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 72,
  },
  bannerHeroSection: {
    height: 280,
    width: '100%',
    position: 'relative',
    alignItems: 'center',
  },
  bannerHeroImage: {
    width: '100%',
    height: 120,
  },
  profileCard: {
    position: 'absolute',
    top: 60,
    width: '92%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  logoCircleWrapper: {
    position: 'absolute',
    top: -36,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoCircular: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyInfoBlock: {
    marginTop: 40,
    alignItems: 'center',
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  verifiedIcon: {
    marginLeft: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0084FF',
  },
  statLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '500',
  },
  postJobBtn: {
    backgroundColor: '#0084FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    width: '100%',
    marginTop: 16,
    elevation: 2,
  },
  postJobBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#0084FF',
    fontSize: 13,
    fontWeight: '700',
  },
  jobsContainer: {
    paddingHorizontal: 16,
  },
  jobCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitleText: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 10,
    lineHeight: 18,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  jobDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  jobDetailText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  bulletPoint: {
    fontSize: 10,
    color: '#8E8E93',
    marginHorizontal: 2,
  },
  jobCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 16,
  },
  avatarOverlapContainer: {
    width: 60,
    height: 24,
    position: 'relative',
  },
  avatarBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFF',
    position: 'absolute',
  },
  avatarCounter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  avatarCounterText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0084FF',
  },
  salaryText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0084FF',
  },
  upgradePlanPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    gap: 10,
  },
  promoTextGroup: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  promoDesc: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  promoBuyBtn: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  promoBuyBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollSpacer: {
    height: 20,
  },
  bottomNavBar: {
    height: 56,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  menuSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(142, 142, 147, 0.2)',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
});
