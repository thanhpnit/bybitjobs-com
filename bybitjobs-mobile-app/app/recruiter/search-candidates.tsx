import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth, CandidateItem, JobItem } from '@/hooks/use-auth';

export default function RecruiterSearchCandidatesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { candidates, jobs, sendInvitation } = useAuth();

  // Search keyword state
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Filter states
  const [selectedExperience, setSelectedExperience] = React.useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = React.useState<string | null>(null);
  const [selectedSalary, setSelectedSalary] = React.useState<string | null>(null);

  // Active jobs to invite candidates to
  const activeJobs = jobs.filter((j) => j.isOpen);

  // Handle select filter chips
  const handleSelectExperience = () => {
    Alert.alert(
      'Lọc Kinh nghiệm',
      'Chọn số năm kinh nghiệm tối thiểu:',
      [
        { text: 'Tất cả', onPress: () => setSelectedExperience(null) },
        { text: 'Dưới 3 năm', onPress: () => setSelectedExperience('Under3') },
        { text: '3 - 5 năm', onPress: () => setSelectedExperience('3to5') },
        { text: 'Trên 5 năm', onPress: () => setSelectedExperience('Above5') },
      ]
    );
  };

  const handleSelectLocation = () => {
    Alert.alert(
      'Lọc Địa điểm',
      'Chọn vị trí địa lý:',
      [
        { text: 'Tất cả', onPress: () => setSelectedLocation(null) },
        { text: 'TP. Hồ Chí Minh', onPress: () => setSelectedLocation('HCM') },
        { text: 'Hà Nội', onPress: () => setSelectedLocation('HN') },
      ]
    );
  };

  const handleSelectSalary = () => {
    Alert.alert(
      'Lọc Yêu cầu Lương',
      'Chọn hình thức thương lượng lương:',
      [
        { text: 'Tất cả', onPress: () => setSelectedSalary(null) },
        { text: 'Theo giờ / Freelance', onPress: () => setSelectedSalary('Hourly') },
        { text: 'Thỏa thuận trực tiếp', onPress: () => setSelectedSalary('Negotiable') },
      ]
    );
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
      if (selectedExperience === 'Under3' && candidate.yearsOfExp >= 3) return false;
      if (selectedExperience === '3to5' && (candidate.yearsOfExp < 3 || candidate.yearsOfExp > 5)) return false;
      if (selectedExperience === 'Above5' && candidate.yearsOfExp <= 5) return false;
    }

    // 3. Location Filter
    if (selectedLocation) {
      const isHCM = candidate.location.includes('HCM') || candidate.location.includes('Hồ Chí Minh') || candidate.location.includes('Quận');
      const isHN = candidate.location.includes('Hà Nội') || candidate.location.includes('Cầu Giấy');
      if (selectedLocation === 'HCM' && !isHCM) return false;
      if (selectedLocation === 'HN' && !isHN) return false;
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

      {/* Navigation Tab Emulator bar */}
      <View style={[styles.bottomNavBar, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderTopColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/dashboard')} style={styles.navItem}>
          <Ionicons name="home-outline" size={22} color="#8E8E93" />
          <Text style={styles.navItemText}>Trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/jobs')} style={styles.navItem}>
          <Ionicons name="briefcase-outline" size={22} color="#8E8E93" />
          <Text style={styles.navItemText}>Việc của tôi</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/candidates')} style={styles.navItem}>
          <Ionicons name="people-outline" size={22} color="#8E8E93" />
          <Text style={styles.navItemText}>Cộng đồng</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/recruiter/profile')} style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color="#8E8E93" />
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
});
