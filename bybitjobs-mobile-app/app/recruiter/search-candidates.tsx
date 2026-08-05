import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth, CandidateItem, JobItem } from '@/hooks/use-auth';

export default function RecruiterSearchCandidatesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { candidates, jobs, sendInvitation, userData } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const isIphoneWithNotch = bottomInset > 0;

  // Search keyword state
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Filter states
  const [selectedExperience, setSelectedExperience] = React.useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = React.useState<string | null>(null);
  const [selectedSalary, setSelectedSalary] = React.useState<string | null>(null);
  const [activeFilterModalType, setActiveFilterModalType] = React.useState<'experience' | 'location' | 'salary' | null>(null);

  // Active jobs to invite candidates to
  const activeJobs = React.useMemo(() => {
    if (!userData?.uid) return [];
    const myJobs = jobs.filter((j) => j.isOpen && j.employerId === userData.uid);
    if (myJobs.length > 0) return myJobs;
    return jobs.filter((j) => j.isOpen);
  }, [jobs, userData?.uid]);

  // Handle select filter chips
  const handleSelectExperience = () => {
    setActiveFilterModalType('experience');
  };

  const handleSelectLocation = () => {
    setActiveFilterModalType('location');
  };

  const handleSelectSalary = () => {
    setActiveFilterModalType('salary');
  };

  // Perform filtering logic
  const filteredCandidates = candidates.filter((candidate) => {
    // 1. Text Search matching name, role, or skills
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesName = candidate.name.toLowerCase().includes(query);
      const matchesRole = candidate.role.toLowerCase().includes(query);
      const matchesSkills = candidate.skills.some((s) => s.toLowerCase().includes(query));
      if (!matchesName && !matchesRole && !matchesSkills) return false;
    }

    // 2. Experience Filter
    if (selectedExperience) {
      if (selectedExperience === 'Under1' && candidate.yearsOfExp >= 1) return false;
      if (selectedExperience === '1to3' && (candidate.yearsOfExp < 1 || candidate.yearsOfExp > 3)) return false;
      if (selectedExperience === '3to5' && (candidate.yearsOfExp < 3 || candidate.yearsOfExp > 5)) return false;
      if (selectedExperience === 'Above5' && candidate.yearsOfExp <= 5) return false;
    }

    // 3. Location Filter
    if (selectedLocation) {
      const loc = candidate.location.toLowerCase();
      if (selectedLocation === 'HCM' && !(loc.includes('hcm') || loc.includes('hồ chí minh') || loc.includes('quận') || loc.includes('thủ đức'))) return false;
      if (selectedLocation === 'HN' && !(loc.includes('hà nội') || loc.includes('cầu giấy') || loc.includes('từ liêm') || loc.includes('hoàn kiếm'))) return false;
      if (selectedLocation === 'DN' && !(loc.includes('đà nẵng') || loc.includes('huế') || loc.includes('quảng nam'))) return false;
      if (selectedLocation === 'Remote' && !(loc.includes('remote') || loc.includes('từ xa') || loc.includes('wfh'))) return false;
    }

    // 4. Salary Filter
    if (selectedSalary) {
      const role = candidate.role.toLowerCase();
      if (selectedSalary === 'Hourly' && !(role.includes('freelance') || role.includes('part-time') || role.includes('giờ'))) return false;
    }

    return true;
  });

  const handleSendInvite = (candidateId: string, candidateName: string) => {
    if (activeJobs.length === 0) {
      Alert.alert(
        'Không có bài đăng hoạt động',
        'Công ty của bạn hiện không có bài tuyển dụng nào đang ở trạng thái ĐANG MỞ. Hãy đăng bài hoặc mở lại bài đăng trước.'
      );
      return;
    }

    // Build the alert options listing the recruiter's active jobs
    const jobOptions = activeJobs.map((job) => ({
      text: job.title,
      onPress: () => {
        sendInvitation(candidateId, job.id);
      },
    }));

    // Add a cancel option at the end
    jobOptions.push({
      text: 'Hủy bỏ',
      onPress: () => {},
    } as any);

    Alert.alert(
      'Chọn bài viết tuyển dụng',
      `Chọn 1 bài đăng của bạn để đính kèm trong lời mời gửi tới ứng viên "${candidateName}":`,
      jobOptions as any
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F8F9FA' }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: '#0084FF' }]}>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>Săn tìm ứng viên</Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => router.push('/recruiter/dashboard')}>
          <Ionicons name="desktop-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Floating search input */}
      <View style={[styles.searchBarContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? '#151718' : '#F4F5F7', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
          <Ionicons name="search-outline" size={18} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#FFF' : '#11181C' }]}
            placeholder="Tìm theo kỹ năng, vị trí công việc..."
            placeholderTextColor={isDark ? '#555' : '#8E8E93'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={16} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Filter Chips */}
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSelectExperience}
            style={[styles.chip, selectedExperience && styles.chipActive, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#444' : '#E5E7EB' }]}
          >
            <Text style={[styles.chipText, selectedExperience && styles.chipTextActive, { color: isDark ? '#FFF' : '#11181C' }]}>
              Kinh nghiệm {selectedExperience ? '✓' : '▾'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSelectLocation}
            style={[styles.chip, selectedLocation && styles.chipActive, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#444' : '#E5E7EB' }]}
          >
            <Text style={[styles.chipText, selectedLocation && styles.chipTextActive, { color: isDark ? '#FFF' : '#11181C' }]}>
              Địa điểm {selectedLocation ? '✓' : '▾'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSelectSalary}
            style={[styles.chip, selectedSalary && styles.chipActive, { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF', borderColor: isDark ? '#444' : '#E5E7EB' }]}
          >
            <Text style={[styles.chipText, selectedSalary && styles.chipTextActive, { color: isDark ? '#FFF' : '#11181C' }]}>
              Lương bổng {selectedSalary ? '✓' : '▾'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main scrolling list of headhunt candidates */}
      <ScrollView contentContainerStyle={{ paddingBottom: isIphoneWithNotch ? 130 : 110 }} showsVerticalScrollIndicator={false}>
        {filteredCandidates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#8E8E93" />
            <Text style={[styles.emptyText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
              Không tìm thấy ứng viên nào phù hợp với bộ lọc tìm kiếm.
            </Text>
          </View>
        ) : (
          filteredCandidates.map((candidate) => (
            <View
              key={candidate.id}
              style={[
                styles.candidateSearchCard,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
                },
              ]}
            >
              {/* Row 1: Profile picture & basic info */}
              <View style={styles.cardUpperRow}>
                <Image source={{ uri: candidate.avatar }} style={styles.avatar} />
                <View style={styles.infoWrapper}>
                  <Text style={[styles.candidateName, { color: isDark ? '#FFF' : '#11181C' }]}>
                    {candidate.name}
                  </Text>
                  <Text style={styles.candidateRole}>
                    {candidate.role}
                  </Text>
                  <Text style={styles.candidateRatingText}>
                    ⭐️ {candidate.rating} • {candidate.yearsOfExp} năm kinh nghiệm
                  </Text>
                </View>

                {/* Favorite toggle bookmark button */}
                <TouchableOpacity style={styles.bookmarkBtn}>
                  <Ionicons name="bookmark-outline" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              {/* Row 2: Tag pills of main skills */}
              <View style={styles.skillsContainer}>
                {candidate.skills.slice(0, 3).map((skill, index) => (
                  <View key={index} style={[styles.skillPill, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                    <Text style={[styles.skillPillText, { color: isDark ? '#9BA1A6' : '#687076' }]}>{skill}</Text>
                  </View>
                ))}
              </View>

              {/* Row 3: Structured List breakdown for Match criteria */}
              <View style={{
                marginTop: 10,
                backgroundColor: isDark ? '#252729' : '#F8FAFC',
                borderRadius: 10,
                padding: 10,
                borderWidth: 1,
                borderColor: isDark ? '#3A3D40' : '#E2E8F0',
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#CBD5E1' : '#475569', marginBottom: 6 }}>
                  📊 Bảng danh sách đánh giá độ phù hợp:
                </Text>

                {/* List Item 1: Chuyên môn & Kỹ năng */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: isDark ? '#3A3D40' : '#F1F5F9' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Ionicons name="ribbon-outline" size={13} color="#059669" />
                    <Text style={{ fontSize: 11, color: isDark ? '#E2E8F0' : '#334155', fontWeight: '500' }}>Chuyên môn & Kỹ năng</Text>
                  </View>
                  <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="checkmark-circle" size={11} color="#059669" />
                    <Text style={{ color: '#065F46', fontSize: 10, fontWeight: '700' }}>Phù hợp</Text>
                  </View>
                </View>

                {/* List Item 2: Kinh nghiệm */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: isDark ? '#3A3D40' : '#F1F5F9' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Ionicons name="briefcase-outline" size={13} color="#059669" />
                    <Text style={{ fontSize: 11, color: isDark ? '#E2E8F0' : '#334155', fontWeight: '500' }}>Kinh nghiệm ({candidate.yearsOfExp} năm)</Text>
                  </View>
                  <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="checkmark-circle" size={11} color="#059669" />
                    <Text style={{ color: '#065F46', fontSize: 10, fontWeight: '700' }}>Phù hợp</Text>
                  </View>
                </View>

                {/* List Item 3: Địa điểm */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: isDark ? '#3A3D40' : '#F1F5F9' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Ionicons name="location-outline" size={13} color="#059669" />
                    <Text style={{ fontSize: 11, color: isDark ? '#E2E8F0' : '#334155', fontWeight: '500' }}>Địa điểm ({candidate.location})</Text>
                  </View>
                  <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="checkmark-circle" size={11} color="#059669" />
                    <Text style={{ color: '#065F46', fontSize: 10, fontWeight: '700' }}>Phù hợp</Text>
                  </View>
                </View>

                {/* List Item 4: Mức lương */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <Ionicons name="cash-outline" size={13} color="#059669" />
                    <Text style={{ fontSize: 11, color: isDark ? '#E2E8F0' : '#334155', fontWeight: '500' }}>Mức lương kỳ vọng</Text>
                  </View>
                  <View style={{ backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Ionicons name="checkmark-circle" size={11} color="#059669" />
                    <Text style={{ color: '#065F46', fontSize: 10, fontWeight: '700' }}>Phù hợp</Text>
                  </View>
                </View>
              </View>

              {/* Bottom divider line */}
              <View style={[styles.cardDivider, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]} />

              {/* Row 3: Location and primary invitation call to action */}
              <View style={styles.cardFooter}>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="#8E8E93" />
                  <Text style={styles.locationText}>{candidate.location}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleSendInvite(candidate.id, candidate.name)}
                  style={styles.inviteButton}
                >
                  <Text style={styles.inviteButtonText}>Gửi lời mời</Text>
                </TouchableOpacity>
              </View>

            </View>
          ))
        )}
      </ScrollView>

      {false && (
      <View style={[
        styles.bottomNavBar, 
        { 
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', 
          borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA',
          height: isIphoneWithNotch ? 82 : 64,
          paddingBottom: isIphoneWithNotch ? 22 : 6,
          paddingTop: 8
        }
      ]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/dashboard')} style={styles.navItem}>
          <Ionicons name="home-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/my-jobs')} style={styles.navItem}>
          <Ionicons name="people-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Quản lý ứng viên</Text>
        </TouchableOpacity>

        {/* Center Raised FAB */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push({ pathname: '/recruiter/edit-job', params: { id: 'new' } })} style={styles.fabNavItem}>
          <View style={[styles.fabCircle, { backgroundColor: '#0060B6', borderColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <Ionicons name="add" size={32} color="#FFF" />
          </View>
          <Text style={styles.fabItemText}>Đăng tin</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/jobs')} style={styles.navItem}>
          <Ionicons name="briefcase-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Quản lý tin tuyển dụng</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/profile')} style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Cá nhân</Text>
        </TouchableOpacity>
      </View>
      )}
      {/* Modal Dạng Danh Sách Chọn Bộ Lọc Thông Minh (List Selection Modal) */}
      <Modal
        visible={activeFilterModalType !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveFilterModalType(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActiveFilterModalType(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: '80%',
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: isDark ? '#2C2C2E' : '#F1F5F9', paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="filter" size={20} color="#0084FF" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFF' : '#0F172A' }}>
                  {activeFilterModalType === 'experience' && 'Danh sách Lọc Số năm Kinh nghiệm'}
                  {activeFilterModalType === 'location' && 'Danh sách Lọc Địa điểm Làm việc'}
                  {activeFilterModalType === 'salary' && 'Danh sách Lọc Mức lương & Hình thức'}
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveFilterModalType(null)}>
                <Ionicons name="close" size={22} color={isDark ? '#FFF' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* List Selection Options */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {activeFilterModalType === 'experience' && [
                { id: null, label: 'Tất cả kinh nghiệm', sub: 'Hiển thị tất cả ứng viên không phân biệt số năm', icon: 'ribbon-outline' },
                { id: 'Under1', label: 'Dưới 1 năm (Fresher / Mới tốt nghiệp)', sub: 'Ứng viên mới tốt nghiệp hoặc dưới 1 năm kinh nghiệm', icon: 'school-outline' },
                { id: '1to3', label: 'Từ 1 đến 3 năm kinh nghiệm (Junior)', sub: 'Ứng viên đã có từ 1-3 năm kinh nghiệm thực chiến', icon: 'briefcase-outline' },
                { id: '3to5', label: 'Từ 3 đến 5 năm kinh nghiệm (Senior)', sub: 'Ứng viên trình độ chuyên sâu 3-5 năm kinh nghiệm', icon: 'trophy-outline' },
                { id: 'Above5', label: 'Trên 5 năm kinh nghiệm (Lead / Expert)', sub: 'Cấp quản lý, chuyên gia hàng đầu trên 5 năm', icon: 'sparkles-outline' },
              ].map((item) => {
                const isSelected = selectedExperience === item.id;
                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedExperience(item.id);
                      setActiveFilterModalType(null);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: isSelected ? (isDark ? '#1E293B' : '#EFF6FF') : (isDark ? '#2C2C2E' : '#F8FAFC'),
                      borderWidth: 1,
                      borderColor: isSelected ? '#0084FF' : (isDark ? '#3A3D40' : '#E2E8F0'),
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isSelected ? '#0084FF' : (isDark ? '#3A3D40' : '#E2E8F0'),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Ionicons name={item.icon as any} size={18} color={isSelected ? '#FFF' : (isDark ? '#CBD5E1' : '#475569')} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13.5, fontWeight: isSelected ? '700' : '600', color: isSelected ? '#0084FF' : (isDark ? '#FFF' : '#0F172A') }}>
                          {item.label}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{item.sub}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "radio-button-off"}
                      size={20}
                      color={isSelected ? "#0084FF" : "#94A3B8"}
                    />
                  </TouchableOpacity>
                );
              })}

              {activeFilterModalType === 'location' && [
                { id: null, label: 'Tất cả địa điểm', sub: 'Tìm ứng viên trên toàn quốc', icon: 'globe-outline' },
                { id: 'HCM', label: 'TP. Hồ Chí Minh', sub: 'Các Quận 1, 3, 7, Tân Bình, TP. Thủ Đức...', icon: 'location-outline' },
                { id: 'HN', label: 'Hà Nội', sub: 'Các Quận Cầu Giấy, Nam Từ Liêm, Hoàn Kiếm...', icon: 'location-outline' },
                { id: 'DN', label: 'Đà Nẵng & Miền Trung', sub: 'Khu vực Đà Nẵng, Huế, Quảng Nam...', icon: 'location-outline' },
                { id: 'Remote', label: 'Làm việc Từ xa (Remote / WFH)', sub: 'Ứng viên nhận làm online / làm tại nhà', icon: 'laptop-outline' },
              ].map((item) => {
                const isSelected = selectedLocation === item.id;
                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedLocation(item.id);
                      setActiveFilterModalType(null);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: isSelected ? (isDark ? '#1E293B' : '#EFF6FF') : (isDark ? '#2C2C2E' : '#F8FAFC'),
                      borderWidth: 1,
                      borderColor: isSelected ? '#0084FF' : (isDark ? '#3A3D40' : '#E2E8F0'),
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isSelected ? '#0084FF' : (isDark ? '#3A3D40' : '#E2E8F0'),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Ionicons name={item.icon as any} size={18} color={isSelected ? '#FFF' : (isDark ? '#CBD5E1' : '#475569')} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13.5, fontWeight: isSelected ? '700' : '600', color: isSelected ? '#0084FF' : (isDark ? '#FFF' : '#0F172A') }}>
                          {item.label}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{item.sub}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "radio-button-off"}
                      size={20}
                      color={isSelected ? "#0084FF" : "#94A3B8"}
                    />
                  </TouchableOpacity>
                );
              })}

              {activeFilterModalType === 'salary' && [
                { id: null, label: 'Tất cả mức lương', sub: 'Không giới hạn hình thức & mức lương', icon: 'cash-outline' },
                { id: 'Negotiable', label: 'Thỏa thuận trực tiếp', sub: 'Thương lượng lương trực tiếp theo năng lực', icon: 'hand-shake-outline' },
                { id: 'Hourly', label: 'Theo giờ / Part-time / Freelance', sub: 'Hình thức tính lương theo giờ hoặc dự án ngắn hạn', icon: 'time-outline' },
                { id: 'Under15M', label: 'Dưới 15 Triệu VNĐ / tháng', sub: 'Mức lương dành cho nhân sự Fresher & Junior', icon: 'wallet-outline' },
                { id: '15to30M', label: 'Từ 15 - 30 Triệu VNĐ / tháng', sub: 'Mức lương phổ biến cho nhân sự Senior', icon: 'wallet-outline' },
                { id: 'Above30M', label: 'Trên 30 Triệu VNĐ / tháng', sub: 'Mức lương thu nhập cao cấp Manager / Director', icon: 'ribbon-outline' },
              ].map((item) => {
                const isSelected = selectedSalary === item.id;
                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedSalary(item.id);
                      setActiveFilterModalType(null);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: isSelected ? (isDark ? '#1E293B' : '#EFF6FF') : (isDark ? '#2C2C2E' : '#F8FAFC'),
                      borderWidth: 1,
                      borderColor: isSelected ? '#0084FF' : (isDark ? '#3A3D40' : '#E2E8F0'),
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isSelected ? '#0084FF' : (isDark ? '#3A3D40' : '#E2E8F0'),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Ionicons name={item.icon as any} size={18} color={isSelected ? '#FFF' : (isDark ? '#CBD5E1' : '#475569')} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13.5, fontWeight: isSelected ? '700' : '600', color: isSelected ? '#0084FF' : (isDark ? '#FFF' : '#0F172A') }}>
                          {item.label}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{item.sub}</Text>
                      </View>
                    </View>
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "radio-button-off"}
                      size={20}
                      color={isSelected ? "#0084FF" : "#94A3B8"}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Clear selection button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (activeFilterModalType === 'experience') setSelectedExperience(null);
                if (activeFilterModalType === 'location') setSelectedLocation(null);
                if (activeFilterModalType === 'salary') setSelectedSalary(null);
                setActiveFilterModalType(null);
              }}
              style={{
                marginTop: 14,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#F1F5F9',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 14 }}>Đặt lại về "Tất cả"</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
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
  searchBarContainer: {
    padding: 14,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    borderColor: '#0084FF',
    backgroundColor: '#EBF5FF',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
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
  candidateSearchCard: {
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
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
  candidateRole: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 3,
  },
  candidateRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF9500',
  },
  bookmarkBtn: {
    padding: 4,
  },
  skillsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingLeft: 58,
  },
  skillPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  skillPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  inviteButton: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    elevation: 1,
  },
  inviteButtonText: {
    color: '#FFF',
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
