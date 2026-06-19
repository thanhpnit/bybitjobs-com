import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';



interface JobItem {
  id: string;
  title: string;
  image: any;
  author: {
    name: string;
    verified: boolean;
    rating: number;
    avatar: string;
  };
  location: string;
  timeLeft: string;
  tags: {
    label: string;
    type: 'category' | 'points' | 'skills';
    icon: keyof typeof Ionicons.glyphMap;
  }[];
  price: string;
  originalIndustry?: string;
  createdAt: string;
  isPremium: boolean;
}

function CandidateHomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { jobs } = useAuth();

  const [activeChip, setActiveChip] = React.useState('Hot');
  const [bookmarkedJobs, setBookmarkedJobs] = React.useState<string[]>([]);
  const [posterNamesByEmployerId, setPosterNamesByEmployerId] = React.useState<Record<string, string>>({});
  const [premiumEmployersById, setPremiumEmployersById] = React.useState<Record<string, boolean>>({});

  const toggleBookmark = (id: string) => {
    if (bookmarkedJobs.includes(id)) {
      setBookmarkedJobs(bookmarkedJobs.filter((bId: string) => bId !== id));
    } else {
      setBookmarkedJobs([...bookmarkedJobs, id]);
    }
  };

  React.useEffect(() => {
    let isActive = true;
    const employerIds = Array.from(new Set(
      jobs
        .filter((job) => {
          if (!job.employerId) return false;
          const needsPosterName = !job.posterName && !posterNamesByEmployerId[job.employerId];
          const needsPremiumStatus = premiumEmployersById[job.employerId] === undefined;
          return needsPosterName || needsPremiumStatus;
        })
        .map((job) => job.employerId as string)
    ));

    if (employerIds.length === 0) return;

    const loadPosterNames = async () => {
      const entries = await Promise.all(employerIds.map(async (employerId) => {
        let name: string | undefined;
        let isPremium = false;

        try {
          const response = await fetch(`http://160.250.246.119:4000/api/users/${employerId}`);
          if (response.ok) {
            const userData = await response.json();
            const userName =
              userData.fullName ||
              userData.full_name ||
              userData.displayName ||
              userData.name;

            if (typeof userName === 'string' && userName.trim()) {
              name = userName.trim();
            }
          }
        } catch (error) {
          console.error('Lỗi lấy tên người đăng tin:', error);
        }

        try {
          const response = await fetch(`http://160.250.246.119:4000/api/employers/${employerId}`);
          if (response.ok) {
            const employerData = await response.json();
            const packageText = [
              employerData.current_package,
              employerData.currentPackage,
              employerData.packageName,
              employerData.servicePackage,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

            isPremium =
              employerData.isPremium === true ||
              packageText.includes('premium') ||
              packageText.includes('diamond') ||
              packageText.includes('vip');
          }
        } catch (error) {
          console.error('Lỗi lấy gói nhà tuyển dụng:', error);
        }

        return { employerId, name, isPremium };
      }));

      if (!isActive) return;

      const nextNames = Object.fromEntries(
        entries
          .filter((entry) => !!entry.name)
          .map((entry) => [entry.employerId, entry.name as string])
      );
      const nextPremiumStatuses = Object.fromEntries(
        entries.map((entry) => [entry.employerId, entry.isPremium])
      );

      if (Object.keys(nextNames).length > 0) {
        setPosterNamesByEmployerId((prev) => ({ ...prev, ...nextNames }));
      }
      if (Object.keys(nextPremiumStatuses).length > 0) {
        setPremiumEmployersById((prev) => {
          let hasChanged = false;
          const next = { ...prev };
          Object.entries(nextPremiumStatuses).forEach(([employerId, isPremium]) => {
            if (next[employerId] !== isPremium) {
              next[employerId] = isPremium;
              hasChanged = true;
            }
          });
          return hasChanged ? next : prev;
        });
      }
    };

    loadPosterNames();

    return () => {
      isActive = false;
    };
  }, [jobs, posterNamesByEmployerId, premiumEmployersById]);

  const provinces = [
    'Tất cả địa điểm',
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'An Giang',
    'Bà Rịa - Vũng Tàu',
    'Bạc Liêu',
    'Bắc Giang',
    'Bắc Kạn',
    'Bắc Ninh',
    'Bến Tre',
    'Bình Dương',
    'Bình Định',
    'Bình Phước',
    'Bình Thuận',
    'Cà Mau',
    'Cao Bằng',
    'Đắk Lắk',
    'Đắk Nông',
    'Điện Biên',
    'Đồng Nai',
    'Đồng Tháp',
    'Gia Lai',
    'Hà Giang',
    'Hà Nam',
    'Hà Tĩnh',
    'Hải Dương',
    'Hậu Giang',
    'Hòa Bình',
    'Hưng Yên',
    'Khánh Hòa',
    'Kiên Giang',
    'Kon Tum',
    'Lai Châu',
    'Lạng Sơn',
    'Lào Cai',
    'Lâm Đồng',
    'Long An',
    'Nam Định',
    'Nghệ An',
    'Ninh Bình',
    'Ninh Thuận',
    'Phú Thọ',
    'Phú Yên',
    'Quảng Bình',
    'Quảng Nam',
    'Quảng Ngãi',
    'Quảng Ninh',
    'Quảng Trị',
    'Sóc Trăng',
    'Sơn La',
    'Tây Ninh',
    'Thái Bình',
    'Thái Nguyên',
    'Thanh Hóa',
    'Thừa Thiên Huế',
    'Tiền Giang',
    'Trà Vinh',
    'Tuyên Quang',
    'Vĩnh Long',
    'Vĩnh Phúc',
    'Yên Bái'
  ];

  const industries = [
    'Tất cả lĩnh vực',
    'Nhà hàng / F&B',
    'UI/UX / Thiết kế',
    'Giao hàng / Vận chuyển',
    'Bán hàng / Tư vấn',
    'Gia sư / Giáo dục',
    'Hành chính / Văn phòng',
    'Kỹ thuật / Cơ khí',
    'Dịch vụ làm đẹp'
  ];

  const [selectedLocation, setSelectedLocation] = React.useState('Chọn địa điểm');
  const [isLocationModalVisible, setIsLocationModalVisible] = React.useState(false);
  const [selectedIndustry, setSelectedIndustry] = React.useState('Chọn lĩnh vực');
  const [isIndustryModalVisible, setIsIndustryModalVisible] = React.useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const getPosterName = (job: (typeof jobs)[number]) => {
    return (
      job.posterName ||
      job.posterFullName ||
      job.postedByName ||
      job.authorName ||
      (job.employerId ? posterNamesByEmployerId[job.employerId] : undefined) ||
      'Nhà tuyển dụng'
    ).trim();
  };

  const getPosterAvatar = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'NT';
  };

  const jobListings: JobItem[] = jobs.map(job => {
    const posterName = getPosterName(job);

    return {
      id: job.id,
      title: job.title,
      image: null,
      author: {
        name: posterName,
        verified: true,
        rating: 5.0,
        avatar: getPosterAvatar(posterName),
      },
      location: job.location,
      timeLeft: job.isOpen ? `Hạn chót: ${job.deadline}` : 'Đã đóng',
      tags: [
        { label: job.industry.length > 15 ? job.industry.substring(0, 15) + '...' : job.industry, type: 'category', icon: 'briefcase-outline' },
      ],
      price: job.salary,
      originalIndustry: job.industry,
      createdAt: job.createdAt,
      isPremium: job.employerId ? premiumEmployersById[job.employerId] === true : false,
    };
  });

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const searchSuggestions = React.useMemo(() => {
    const keyword = normalizeText(searchQuery.trim());
    if (!keyword) return [];

    return jobListings
      .filter((job) => {
        const searchableText = normalizeText([
          job.title,
          job.author.name,
          job.location,
          job.price,
          job.originalIndustry || '',
        ].join(' '));
        return searchableText.includes(keyword);
      })
      .slice(0, 8);
  }, [jobListings, searchQuery]);

  const openJobDetails = (job: JobItem) => {
    setIsSearchModalVisible(false);
    setSearchQuery('');
    router.push({
      pathname: '/job-details',
      params: {
        jobId: job.id,
        title: job.title,
        companyName: job.author.name,
        salary: job.price,
        location: job.location,
      },
    });
  };

  const getCreatedTime = (dateString: string) => {
    const time = new Date(dateString).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const filteredJobs = jobListings.filter(job => {
    // Filter by Location
    let matchLocation = true;
    if (selectedLocation !== 'Chọn địa điểm' && selectedLocation !== 'Tất cả địa điểm') {
      if (selectedLocation === 'TP. Hồ Chí Minh') {
        matchLocation = job.location.includes('Phú Nhuận') || job.location.includes('Gò Vấp') || job.location.includes('Hồ Chí Minh');
      } else if (selectedLocation === 'Hà Nội') {
        matchLocation = job.location.includes('Hà Nội') || job.location.includes('Hoàn Kiếm');
      } else {
        matchLocation = job.location.includes(selectedLocation);
      }
    }

    // Filter by Industry
    let matchIndustry = true;
    if (selectedIndustry !== 'Chọn lĩnh vực' && selectedIndustry !== 'Tất cả lĩnh vực') {
      matchIndustry = job.originalIndustry === selectedIndustry;
    }

    return matchLocation && matchIndustry;
  }).sort((a, b) => {
    if (activeChip === 'Hot' && a.isPremium !== b.isPremium) {
      return a.isPremium ? -1 : 1;
    }
    return getCreatedTime(b.createdAt) - getCreatedTime(a.createdAt);
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Background Header Gradient Simulation */}
      <View style={styles.gradientHeaderBg} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top Bar Header */}
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
                <Ionicons name="menu-outline" size={26} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.brandTitle}>BybitJobs</Text>
            </View>

            <View style={styles.headerRightGroup}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsSearchModalVisible(true)}
                style={styles.iconButton}
              >
                <Ionicons name="search-outline" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Selectors / Dropdowns Row */}
          <View style={styles.selectorsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsIndustryModalVisible(true)}
              style={styles.selectorDropdown}
            >
              <Text style={styles.selectorText} numberOfLines={1}>
                {selectedIndustry}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsLocationModalVisible(true)}
              style={styles.selectorDropdown}
            >
              <Text style={styles.selectorText} numberOfLines={1}>
                {selectedLocation}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Promotion Campaign Banner */}
          <View style={[styles.bannerCard, { backgroundColor: isDark ? '#1C2E3D' : '#EAF4FC' }]}>
            <View style={styles.bannerLeft}>
              <Text style={[styles.bannerTitle, { color: isDark ? '#82C1F5' : '#0B59A4' }]}>
                Thúc đẩy hiệu quả chiến dịch bằng quảng cáo banner trên BybitJobs
              </Text>
              <Text style={[styles.bannerDescription, { color: isDark ? '#A9C6E2' : '#5A6B82' }]}>
                Từ ngày 15/12/2025 đến hết 30/1/2026, BybitJobs cam kết đồng hành cùng Doanh nghiệp trích 15% phí booking quảng cáo đóng góp quỹ MTTQ Việt Nam để giúp đỡ nhiều hoàn cảnh khó khăn dịp Tết 2026.
              </Text>
            </View>
            <View style={styles.bannerRight}>
              <Image
                source={require('../../assets/images/small_jobs_banner.png')}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Filter Chips ScrollView */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {['Hot', 'Mới nhất'].map((chip) => {
              const isActive = activeChip === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  activeOpacity={0.7}
                  onPress={() => setActiveChip(chip)}
                  style={[
                    styles.chipItem,
                    isActive ? styles.chipItemActive : (isDark ? styles.chipItemDark : styles.chipItemInactive),
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isActive ? styles.chipTextActive : (isDark ? styles.chipTextDark : styles.chipTextInactive),
                    ]}
                  >
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Job Feed List */}
          <View style={styles.feedContainer}>
            {filteredJobs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={isDark ? '#555' : '#CCC'} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                  Chưa có công việc phù hợp tại địa điểm/lĩnh vực này
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedLocation('Tất cả địa điểm');
                    setSelectedIndustry('Tất cả lĩnh vực');
                  }}
                  style={styles.resetFilterBtn}
                >
                  <Text style={styles.resetFilterBtnText}>Xem tất cả công việc</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredJobs.map((job) => {
                const isBookmarked = bookmarkedJobs.includes(job.id);
                return (
                  <TouchableOpacity
                    key={job.id}
                    activeOpacity={0.9}
                    onPress={() => openJobDetails(job)}
                    style={[styles.jobCard, isDark ? styles.jobCardDark : styles.jobCardLight]}
                  >
                    <View style={styles.jobCardTop}>
                      {/* Job Image/Avatar */}
                      <View style={styles.jobImageWrapper}>
                        {job.image ? (
                          <Image source={job.image} style={styles.jobImage} resizeMode="cover" />
                        ) : (
                          <View style={[styles.jobImageFallback, { backgroundColor: isDark ? '#2C2C2E' : '#FFF3E0' }]}>
                            {/* Custom Vector Coder Girl Mock */}
                            <Ionicons name="desktop-outline" size={24} color="#FF9800" />
                          </View>
                        )}
                        {job.isPremium && (
                          <View style={styles.hotBadge}>
                            <Text style={styles.hotBadgeText}>HOT</Text>
                          </View>
                        )}
                      </View>

                      {/* Job Main Details */}
                      <View style={styles.jobDetails}>
                        <View style={styles.titleRow}>
                          <Text
                            style={[styles.jobTitle, { color: isDark ? '#FFF' : '#11181C' }]}
                            numberOfLines={2}
                          >
                            {job.title}
                          </Text>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => toggleBookmark(job.id)}
                            style={styles.bookmarkButton}
                          >
                            <Ionicons
                              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                              size={20}
                              color={isBookmarked ? '#0084FF' : '#8E8E93'}
                            />
                          </TouchableOpacity>
                        </View>

                        {/* Author Info */}
                        <View style={styles.authorRow}>
                          <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#3C3C3E' : '#ECEFF1' }]}>
                            <Text style={[styles.avatarText, { color: isDark ? '#FFF' : '#37474F' }]}>
                              {job.author.avatar}
                            </Text>
                          </View>
                          <Text style={[styles.authorName, { color: isDark ? '#ECEDEE' : '#333' }]}>
                            {job.author.name}
                          </Text>
                          {job.author.verified && (
                            <Ionicons
                              name="checkmark-circle"
                              size={14}
                              color="#0084FF"
                              style={styles.checkIcon}
                            />
                          )}
                          <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={12} color="#FFB300" style={styles.starIcon} />
                            <Text style={[styles.ratingText, { color: isDark ? '#ECEDEE' : '#666' }]}>
                              {job.author.rating}
                            </Text>
                          </View>
                        </View>

                        {/* Location Row */}
                        <View style={styles.infoRow}>
                          <Ionicons name="location-sharp" size={14} color="#FF3D00" />
                          <Text style={[styles.infoText, { color: isDark ? '#A9A9A9' : '#687076' }]}>
                            {job.location}
                          </Text>
                        </View>

                        {/* Remaining Time Row */}
                        <View style={styles.infoRow}>
                          <Ionicons name="time-outline" size={14} color="#8E8E93" />
                          <Text style={[styles.infoText, { color: isDark ? '#A9A9A9' : '#687076' }]}>
                            {job.timeLeft}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Job Card Bottom (Tags & Price) */}
                    <View style={styles.jobCardBottom}>
                      <View style={styles.tagsContainer}>
                        {job.tags.map((tag, idx) => {
                          const isPoints = tag.type === 'points';
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.tagBubble,
                                {
                                  backgroundColor: isPoints
                                    ? (isDark ? '#3D2418' : '#FFEFE6')
                                    : (isDark ? '#1C2A3A' : '#E6F4FE'),
                                },
                              ]}
                            >
                              <Ionicons
                                name={tag.icon}
                                size={12}
                                color={isPoints ? '#FF8A00' : '#0084FF'}
                                style={styles.tagIcon}
                              />
                              <Text
                                style={[
                                  styles.tagText,
                                  { color: isPoints ? '#FF8A00' : '#0084FF' },
                                ]}
                              >
                                {tag.label}
                              </Text>
                            </View>
                          );
                        })}
                      </View>

                      <View style={[styles.priceBubble, isDark && styles.priceBubbleDark]}>
                        <Text style={styles.priceText} numberOfLines={1}>{job.price}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Safe padding bottom for scrolling */}
          <View style={styles.scrollPaddingBottom} />
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={isSearchModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSearchModalVisible(false)}
      >
        <View style={styles.searchModalOverlay}>
          <View style={[styles.searchPanel, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={[styles.searchInputWrapper, { borderColor: isDark ? '#2C2C2E' : '#E5E5EA', backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
              <Ionicons name="search-outline" size={20} color="#8E8E93" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                placeholder="Nhập vài chữ đầu để tìm việc..."
                placeholderTextColor="#8E8E93"
                style={[styles.searchInput, { color: isDark ? '#FFF' : '#11181C' }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setIsSearchModalVisible(false);
                    setSearchQuery('');
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.searchResultsList}>
              {searchQuery.trim().length === 0 ? (
                <View style={styles.searchEmptyBox}>
                  <Ionicons name="sparkles-outline" size={30} color="#0084FF" />
                  <Text style={[styles.searchEmptyTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                    Tìm nhanh công việc
                  </Text>
                  <Text style={styles.searchEmptyText}>
                    Gõ tên việc, khu vực, lĩnh vực hoặc mức lương để xem đề xuất.
                  </Text>
                </View>
              ) : searchSuggestions.length === 0 ? (
                <View style={styles.searchEmptyBox}>
                  <Ionicons name="search-outline" size={30} color="#8E8E93" />
                  <Text style={[styles.searchEmptyTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                    Không tìm thấy công việc phù hợp
                  </Text>
                </View>
              ) : (
                searchSuggestions.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    activeOpacity={0.8}
                    onPress={() => openJobDetails(job)}
                    style={[styles.searchSuggestionItem, { borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}
                  >
                    <View style={[styles.searchSuggestionIcon, { backgroundColor: isDark ? '#1C2A3A' : '#E6F4FE' }]}>
                      <Ionicons name="briefcase-outline" size={18} color="#0084FF" />
                    </View>
                    <View style={styles.searchSuggestionTextCol}>
                      <Text style={[styles.searchSuggestionTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                        {job.title}
                      </Text>
                      <Text style={styles.searchSuggestionMeta} numberOfLines={1}>
                        {job.author.name} • {job.location}
                      </Text>
                    </View>
                    <Text style={styles.searchSuggestionPrice} numberOfLines={1}>
                      {job.price}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

          </View>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <Modal
        visible={isLocationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsLocationModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsLocationModalVisible(false)}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Chọn tỉnh / thành phố
              </Text>
              <TouchableOpacity
                onPress={() => setIsLocationModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#333'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {provinces.map((prov) => {
                const isSelected = selectedLocation === prov || (prov === 'Tất cả địa điểm' && selectedLocation === 'Chọn địa điểm');
                return (
                  <TouchableOpacity
                    key={prov}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedLocation(prov);
                      setIsLocationModalVisible(false);
                    }}
                    style={[
                      styles.modalItem,
                      { borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1' },
                      isSelected && { backgroundColor: isDark ? '#26354A' : '#E6F4FE' }
                    ]}
                  >
                    <Text style={[
                      styles.modalItemText,
                      { color: isDark ? '#FFF' : '#333' },
                      isSelected && { color: '#0084FF', fontWeight: 'bold' }
                    ]}>
                      {prov}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#0084FF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Industry Selection Modal */}
      <Modal
        visible={isIndustryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsIndustryModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsIndustryModalVisible(false)}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Chọn lĩnh vực công việc
              </Text>
              <TouchableOpacity
                onPress={() => setIsIndustryModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#333'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {industries.map((ind) => {
                const isSelected = selectedIndustry === ind || (ind === 'Tất cả lĩnh vực' && selectedIndustry === 'Chọn lĩnh vực');
                return (
                  <TouchableOpacity
                    key={ind}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedIndustry(ind);
                      setIsIndustryModalVisible(false);
                    }}
                    style={[
                      styles.modalItem,
                      { borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1' },
                      isSelected && { backgroundColor: isDark ? '#26354A' : '#E6F4FE' }
                    ]}
                  >
                    <Text style={[
                      styles.modalItemText,
                      { color: isDark ? '#FFF' : '#333' },
                      isSelected && { color: '#0084FF', fontWeight: 'bold' }
                    ]}>
                      {ind}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#0084FF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 240 : 220,
    backgroundColor: '#0084FF',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    height: 60,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 12,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBtn: {
    position: 'relative',
    marginLeft: 8,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3D00',
    borderWidth: 1.5,
    borderColor: '#0084FF',
  },
  selectorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  selectorDropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    height: 42,
    paddingHorizontal: 16,
  },
  selectorText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  overlapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 22,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  overlapCardDark: {
    backgroundColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrapper: {
    position: 'relative',
  },
  circleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dollarSymbol: {
    color: '#0084FF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  hotBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3D00',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  hotBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  bannerCard: {
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 18,
    padding: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bannerLeft: {
    flex: 1.3,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 20,
    marginBottom: 8,
  },
  bannerDescription: {
    fontSize: 10,
    lineHeight: 15,
  },
  bannerRight: {
    flex: 1,
    height: 120,
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  chipItem: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipItemActive: {
    backgroundColor: '#E6F4FE',
    borderColor: '#0084FF',
  },
  chipItemInactive: {
    backgroundColor: '#FFF',
    borderColor: '#E5E5EA',
  },
  chipItemDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0084FF',
  },
  chipTextInactive: {
    color: '#687076',
  },
  chipTextDark: {
    color: '#9BA1A6',
  },
  feedContainer: {
    paddingHorizontal: 16,
  },
  jobCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  jobCardLight: {
    backgroundColor: '#FFFFFF',
  },
  jobCardDark: {
    backgroundColor: '#1C1C1E',
    shadowOpacity: 0.2,
  },
  jobCardTop: {
    flexDirection: 'row',
  },
  jobImageWrapper: {
    width: 60,
    height: 60,
  },
  jobImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  jobImageFallback: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobDetails: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 20,
    flex: 1,
    paddingRight: 6,
  },
  bookmarkButton: {
    padding: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
  },
  jobCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  tagBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tagIcon: {
    marginRight: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  priceBubble: {
    backgroundColor: '#E6F4FE',
    width: 112,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  priceBubbleDark: {
    backgroundColor: '#152E47',
  },
  priceText: {
    color: '#0084FF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollPaddingBottom: {
    height: 40,
  },
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 64 : 42,
  },
  searchPanel: {
    borderRadius: 18,
    padding: 14,
    maxHeight: '78%',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  searchInputWrapper: {
    height: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '600',
  },
  searchResultsList: {
    marginTop: 10,
  },
  searchEmptyBox: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  searchEmptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
    textAlign: 'center',
  },
  searchEmptyText: {
    color: '#8E8E93',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  searchSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchSuggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  searchSuggestionTextCol: {
    flex: 1,
    minWidth: 0,
  },
  searchSuggestionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  searchSuggestionMeta: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
  },
  searchSuggestionPrice: {
    color: '#0084FF',
    fontSize: 12,
    fontWeight: 'bold',
    maxWidth: 92,
    marginLeft: 8,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    width: '100%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeModalBtn: {
    padding: 4,
  },
  modalList: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 10,
    marginVertical: 1,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFilterBtn: {
    backgroundColor: '#0084FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetFilterBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

import RecruiterDashboardScreen from '../recruiter/dashboard';

export default function HomeScreen() {
  const { userRole } = useAuth();
  if (userRole === 'employer') {
    return <RecruiterDashboardScreen />;
  }
  return <CandidateHomeScreen />;
}
