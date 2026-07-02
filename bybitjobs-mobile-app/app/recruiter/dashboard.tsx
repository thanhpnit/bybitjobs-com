import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

interface MarketJobItem {
  id: string;
  title: string;
  image?: any;
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
  originalIndustry: string;
}

export default function RecruiterDashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { employerData, jobs, logout, unreadNotificationsCount } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const isIphoneWithNotch = bottomInset > 0;

  const [isMenuVisible, setIsMenuVisible] = React.useState(false);
  const handleOpenMenu = () => setIsMenuVisible(true);
  const handleCloseMenu = () => setIsMenuVisible(false);

  const [selectedLocation, setSelectedLocation] = React.useState('Chọn địa điểm');
  const [isLocationModalVisible, setIsLocationModalVisible] = React.useState(false);
  const [selectedIndustry, setSelectedIndustry] = React.useState('Chọn lĩnh vực');
  const [isIndustryModalVisible, setIsIndustryModalVisible] = React.useState(false);
  const [activeChip, setActiveChip] = React.useState('Hot');
  const [bookmarkedJobs, setBookmarkedJobs] = React.useState<string[]>([]);
  const [posterNamesByEmployerId, setPosterNamesByEmployerId] = React.useState<Record<string, string>>({});
  const [premiumEmployersById, setPremiumEmployersById] = React.useState<Record<string, boolean>>({});

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

  const getPosterName = (job: any) => {
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

  const handlePostJob = () => {
    router.push({
      pathname: '/recruiter/edit-job',
      params: { id: 'new' },
    });
  };

  const handleQuickAction = (actionName: string) => {
    Alert.alert('Chức năng nhanh', `Chức năng "${actionName}" đang được phát triển.`);
  };

  const handleNavItemPress = (item: string) => {
    if (item === 'Cá nhân') {
      router.push('/recruiter/profile');
    } else if (item === 'Trang chủ') {
      router.push('/recruiter/dashboard');
    } else if (item === 'Quản lý tin tuyển dụng') {
      router.push('/recruiter/jobs');
    } else if (item === 'Quản lý ứng viên') {
      router.push('/recruiter/candidates');
    } else if (item === 'Đăng tin') {
      handlePostJob();
    }
  };

  const provinces = [
    'Tất cả địa điểm',
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'An Giang',
    'Bà Rịa - Vũng Tàu',
    'Bình Dương',
    'Đồng Nai',
    'Khánh Hòa',
    'Lâm Đồng',
    'Long An',
    'Quảng Ninh',
    'Thanh Hóa',
    'Thừa Thiên Huế'
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

  const toggleBookmark = (id: string) => {
    if (bookmarkedJobs.includes(id)) {
      setBookmarkedJobs(bookmarkedJobs.filter((bId) => bId !== id));
    } else {
      setBookmarkedJobs([...bookmarkedJobs, id]);
    }
  };

  const getCreatedTime = (dateString: string) => {
    const time = new Date(dateString).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const openJobs = jobs.filter(job => job.isOpen !== false);
  const combinedJobs: MarketJobItem[] = openJobs.map((job) => {
    const posterName = getPosterName(job);
    const isPremium = job.employerId ? premiumEmployersById[job.employerId] === true : false;
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
        { label: job.industry.length > 15 ? job.industry.substring(0, 15) + '...' : job.industry, type: 'category' as const, icon: 'briefcase-outline' as const }
      ],
      price: job.salary,
      originalIndustry: job.industry,
      createdAt: job.createdAt,
      isPremium,
    } as any;
  });

  const filteredJobs = combinedJobs.filter((job) => {
    let matchLocation = true;
    if (selectedLocation !== 'Chọn địa điểm' && selectedLocation !== 'Tất cả địa điểm') {
      if (selectedLocation === 'TP. Hồ Chí Minh') {
        matchLocation = job.location.includes('Phú Nhuận') || job.location.includes('Gò Vấp') || job.location.includes('Hồ Chí Minh');
      } else if (selectedLocation === 'Hà Nội') {
        matchLocation = job.location.includes('Hà Nội') || job.location.includes('Hoàn Kiếm') || job.location.includes('Cầu Giấy');
      } else {
        matchLocation = job.location.includes(selectedLocation);
      }
    }

    let matchIndustry = true;
    if (selectedIndustry !== 'Chọn lĩnh vực' && selectedIndustry !== 'Tất cả lĩnh vực') {
      matchIndustry = job.originalIndustry === selectedIndustry;
    }

    return matchLocation && matchIndustry;
  }).sort((a, b) => {
    if (activeChip === 'Hot' && (a as any).isPremium !== (b as any).isPremium) {
      return (a as any).isPremium ? -1 : 1;
    }
    return getCreatedTime((b as any).createdAt) - getCreatedTime((a as any).createdAt);
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      <View style={styles.gradientHeaderBg} />
      <View style={styles.headerBar}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={handleOpenMenu}>
            <Ionicons name="menu-outline" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerBarTitle}>BybitJobs</Text>
        </View>
        <View style={styles.headerRightGroup}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}>
            <Ionicons name="search-outline" size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFF" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: isIphoneWithNotch ? 130 : 110 }} showsVerticalScrollIndicator={false}>
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

        <View style={styles.feedContainer}>
          {filteredJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={isDark ? '#555' : '#CCC'} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                Chưa có yêu cầu công việc phù hợp tại địa điểm/lĩnh vực này
              </Text>
            </View>
          ) : (
            filteredJobs.map((job) => {
              const isBookmarked = bookmarkedJobs.includes(job.id);
              return (
                <TouchableOpacity
                  key={job.id}
                  activeOpacity={0.9}
                  onPress={() => {
                    router.push({
                      pathname: '/job-details',
                      params: {
                        jobId: job.id,
                        title: job.title,
                        salary: job.price,
                        location: job.location,
                      },
                    });
                  }}
                  style={[styles.jobCard, isDark ? styles.jobCardDark : styles.jobCardLight]}
                >
                  <View style={styles.jobCardTop}>
                    <View style={{ position: 'relative' }}>
                      {job.image ? (
                        <Image source={job.image} style={styles.jobImage} resizeMode="cover" />
                      ) : (
                        <View style={[styles.jobImageFallback, { backgroundColor: isDark ? '#2C2C2E' : '#FFF3E0' }]}>
                          <Ionicons name="desktop-outline" size={24} color="#FF9800" />
                        </View>
                      )}
                      {(job as any).isPremium && (
                        <View style={[styles.hotBadge, { top: -6, right: -6 }]}>
                          <Text style={styles.hotBadgeText}>HOT</Text>
                        </View>
                      )}
                    </View>

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

                      <View style={styles.infoRow}>
                        <Ionicons name="location-sharp" size={14} color="#FF3D00" />
                        <Text style={[styles.infoText, { color: isDark ? '#A9A9A9' : '#687076' }]}>
                          {job.location}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={14} color="#8E8E93" />
                        <Text style={[styles.infoText, { color: isDark ? '#A9A9A9' : '#687076' }]}>
                          {job.timeLeft}
                        </Text>
                      </View>
                    </View>
                  </View>

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
                      <Text style={styles.priceText}>{job.price}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.scrollSpacer} />
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
        <TouchableOpacity activeOpacity={0.7} onPress={() => handleNavItemPress('Trang chủ')} style={styles.navItem}>
          <Ionicons name="home" size={24} color="#0084FF" />
          <Text style={[styles.navItemText, { color: '#0084FF' }]}>Trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => handleNavItemPress('Quản lý ứng viên')} style={styles.navItem}>
          <Ionicons name="people-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Quản lý ứng viên</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.85} onPress={() => handleNavItemPress('Đăng tin')} style={styles.fabNavItem}>
          <View style={[styles.fabCircle, { backgroundColor: '#0060B6', borderColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <Ionicons name="add" size={32} color="#FFF" />
          </View>
          <Text style={styles.fabItemText}>Đăng tin</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => handleNavItemPress('Quản lý tin tuyển dụng')} style={styles.navItem}>
          <Ionicons name="briefcase-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Quản lý tin tuyển dụng</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={() => handleNavItemPress('Cá nhân')} style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#8E8E93" />
          <Text style={styles.navItemText}>Cá nhân</Text>
        </TouchableOpacity>
      </View>
      )}

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

                <TouchableOpacity style={styles.menuItem} onPress={() => {
                  handleCloseMenu();
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
                }}>
                  <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
                  <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Đăng xuất</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
    </SafeAreaView>
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
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBarTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 90,
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
  quickFunctionsCard: {
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickItem: {
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
  quickLabel: {
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
  scrollSpacer: {
    height: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
});
