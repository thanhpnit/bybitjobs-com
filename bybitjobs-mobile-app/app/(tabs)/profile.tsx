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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'expo-router';

type SubTab = 'CV của tôi' | 'Việc làm đã xem' | 'Việc làm đã ứng tuyển' | 'Lời mời việc';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { isLoggedIn, logout, userData } = useAuth();

  const [activeSubTab, setActiveSubTab] = React.useState<SubTab>('CV của tôi');

  const displayName = userData?.fullName || 'Nguyễn Minh Quân';

  const getInitial = (name: string) => {
    if (!name) return 'Q';
    const parts = name.trim().split(' ');
    if (parts.length === 0) return 'Q';
    const lastPart = parts[parts.length - 1];
    return lastPart.charAt(0).toUpperCase();
  };

  const initialLetter = getInitial(displayName);

  const handleEditProfile = () => {
    Alert.alert('Thông báo', 'Chức năng chỉnh sửa hồ sơ đang được cập nhật.');
  };

  const handlePreviewCV = () => {
    Alert.alert('Xem trước CV', 'Mở trình duyệt xem trước tệp CV_NguyenMinhQuan_Senior_Web.pdf');
  };

  const handleDownloadCV = () => {
    Alert.alert('Tải xuống CV', 'Bắt đầu tải xuống tệp CV_NguyenMinhQuan_Senior_Web.pdf (1.2MB)...');
  };

  // 1. Locked state when user is not logged in
  if (!isLoggedIn) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
        {/* Top Header Background */}
        <View style={styles.headerBg} />
        
        <SafeAreaView style={styles.safeArea}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerBarPlaceholder} />
            <Text style={styles.headerTitle}>Smalljobs.vn</Text>
            <View style={styles.headerBarPlaceholder} />
          </View>

          {/* Centered Locked Prompt Card */}
          <View style={styles.lockedContainer}>
            <View style={[styles.whiteCard, styles.lockedCard, isDark && styles.darkCard]}>
              <View style={[styles.lockedIconCircle, { backgroundColor: isDark ? '#152E47' : '#E6F4FE' }]}>
                <Ionicons name="lock-closed" size={36} color="#0084FF" />
              </View>
              <Text style={[styles.lockedTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Yêu cầu đăng nhập
              </Text>
              <Text style={styles.lockedSubtitle}>
                Vui lòng đăng nhập để xem thông tin cá nhân và quản lý hồ sơ CV của bạn.
              </Text>
              
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/login')}
                style={styles.lockedButton}
              >
                <Text style={styles.lockedButtonText}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // 2. Full premium profile view when logged in
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Top Header Background */}
      <View style={styles.headerBg} />

      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar with Logout button */}
        <View style={styles.headerBar}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
            <Ionicons name="menu-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Smalljobs.vn</Text>
          <View style={styles.headerRightGroup}>
            <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={logout} style={[styles.iconButton, { marginLeft: 8 }]}>
              <Ionicons name="log-out-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Profile Content */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Avatar and Basic Info Card */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <View
                style={[
                  styles.avatarImage,
                  {
                    backgroundColor: '#0084FF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderColor: isDark ? '#3C3C3E' : '#FFF',
                  },
                ]}
              >
                <Text style={styles.avatarInitialText}>{initialLetter}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.8} onPress={handleEditProfile} style={styles.pencilOverlay}>
                <Ionicons name="pencil" size={12} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.userName, { color: isDark ? '#FFF' : '#11181C' }]}>{displayName}</Text>
            <Text style={styles.userId}>USER ID: SJ-992834</Text>

            <TouchableOpacity activeOpacity={0.8} onPress={handleEditProfile} style={styles.editProfileBtn}>
              <Text style={styles.editProfileBtnText}>Chỉnh sửa hồ sơ</Text>
            </TouchableOpacity>
          </View>

          {/* Personal Info Card (Thông tin cá nhân) */}
          <View style={[styles.whiteCard, isDark && styles.darkCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="card-outline" size={20} color="#0084FF" style={styles.cardHeaderIcon} />
              <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Thông tin cá nhân
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

            {/* Email Row */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                <Ionicons name="mail-outline" size={16} color="#0084FF" />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>EMAIL</Text>
                <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#11181C' }]}>
                  quan.nguyen@example.com
                </Text>
              </View>
            </View>

            {/* Phone Row */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                <Ionicons name="call-outline" size={16} color="#0084FF" />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>SỐ ĐIỆN THOẠI</Text>
                <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#11181C' }]}>
                  090 1234 567
                </Text>
              </View>
            </View>

            {/* Role Row */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                <Ionicons name="people-outline" size={16} color="#0084FF" />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>VAI TRÒ</Text>
                <Text style={[styles.infoValueActive, { color: '#0084FF' }]}>
                  Người tìm việc
                </Text>
              </View>
            </View>
          </View>

          {/* Activity Logs Card (Hoạt động) */}
          <View style={[styles.whiteCard, isDark && styles.darkCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={20} color="#0084FF" style={styles.cardHeaderIcon} />
              <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Hoạt động
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1' }]} />

            {/* Creation Date Row */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                <Ionicons name="calendar-outline" size={16} color="#0084FF" />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>NGÀY TẠO</Text>
                <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#11181C' }]}>
                  15/10/2023
                </Text>
              </View>
            </View>

            {/* Last Login Row */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                <Ionicons name="log-in-outline" size={16} color="#0084FF" />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>ĐĂNG NHẬP GẦN NHẤT</Text>
                <Text style={[styles.infoValue, { color: isDark ? '#FFF' : '#11181C' }]}>
                  24/05/2024 - 14:30
                </Text>
              </View>
            </View>

            {/* Profile Status Row */}
            <View style={styles.infoRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                <Ionicons name="checkmark-done-outline" size={16} color="#0084FF" />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>TRẠNG THÁI HỒ SƠ</Text>
                <View style={styles.verifiedStatusRow}>
                  <Text style={[styles.infoValueVerified, { color: '#4CAF50' }]}>
                    Đã xác thực
                  </Text>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" style={styles.checkIcon} />
                </View>
              </View>
            </View>
          </View>

          {/* Sub-Tabs Categories Card */}
          <View style={[styles.whiteCard, styles.tabbedCard, isDark && styles.darkCard]}>
            {/* Horizontal Sub-Tabs Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subTabBar}
            >
              {(['CV của tôi', 'Việc làm đã xem', 'Việc làm đã ứng tuyển', 'Lời mời việc'] as SubTab[]).map((tab) => {
                const isActive = activeSubTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    activeOpacity={0.7}
                    onPress={() => setActiveSubTab(tab)}
                    style={[styles.subTabItem, isActive && styles.subTabItemActive]}
                  >
                    <Text
                      style={[
                        styles.subTabText,
                        isActive ? styles.subTabTextActive : (isDark ? styles.subTabTextDark : styles.subTabTextInactive),
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Active Content Body */}
            {activeSubTab === 'CV của tôi' ? (
              <View style={[styles.dashedBox, { borderColor: isDark ? '#2C2C2E' : '#B0BEC5' }]}>
                <View style={[styles.documentCircle, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="reader" size={32} color="#0084FF" />
                </View>
                
                <Text style={[styles.documentTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                  CV_NguyenMinhQuan_Senior_Web.pdf
                </Text>
                <Text style={styles.documentMeta}>
                  Cập nhật lần cuối: 2 ngày trước • 1.2MB
                </Text>

                {/* CV Action Row */}
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
                    onPress={handleDownloadCV}
                    style={styles.downloadButton}
                  >
                    <Ionicons name="download-outline" size={16} color="#FFF" style={styles.buttonIcon} />
                    <Text style={styles.downloadText}>Tải xuống</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              // Templates for other subtabs (to be finalized later)
              <View style={styles.emptyView}>
                <Ionicons name="folder-open-outline" size={36} color="#B0BEC5" />
                <Text style={styles.emptyText}>Đang cập nhật danh mục {activeSubTab}...</Text>
              </View>
            )}
          </View>

          {/* Safe spacing at bottom */}
          <View style={styles.scrollPaddingBottom} />
        </ScrollView>
      </SafeAreaView>
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
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  pencilOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 14,
  },
  editProfileBtn: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  editProfileBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  tabbedCard: {
    paddingHorizontal: 0,
  },
  subTabBar: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 20,
  },
  subTabItem: {
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabItemActive: {
    borderBottomColor: '#0084FF',
  },
  subTabText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  subTabTextActive: {
    color: '#0084FF',
  },
  subTabTextInactive: {
    color: '#687076',
  },
  subTabTextDark: {
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
    maxHeight: 38,
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
    maxHeight: 38,
  },
  downloadText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 6,
  },
  emptyView: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 10,
  },
  scrollPaddingBottom: {
    height: 40,
  },
  avatarInitialText: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: 'bold',
  },
});
