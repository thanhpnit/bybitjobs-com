import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';



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
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [activeChip, setActiveChip] = React.useState('Hot');
  const [bookmarkedJobs, setBookmarkedJobs] = React.useState<string[]>([]);

  const toggleBookmark = (id: string) => {
    if (bookmarkedJobs.includes(id)) {
      setBookmarkedJobs(bookmarkedJobs.filter((bId: string) => bId !== id));
    } else {
      setBookmarkedJobs([...bookmarkedJobs, id]);
    }
  };

  const jobListings: JobItem[] = [
    {
      id: 'job-1',
      title: 'Cần phụ việc tại nhà hàng tiệc cưới Gò Vấp',
      image: require('../../assets/images/wedding_banquet.png'),
      author: {
        name: 'Tiến Thắng',
        verified: true,
        rating: 4.5,
        avatar: 'TT',
      },
      location: 'Phú Nhuận',
      timeLeft: 'Còn 3 ngày, 3 giờ',
      tags: [
        { label: 'Nhà hàng', type: 'category', icon: 'restaurant-outline' },
        { label: '500', type: 'points', icon: 'logo-usd' },
      ],
      price: '300.000đ',
    },
    {
      id: 'job-2',
      title: 'Tôi cần một người có chuyên môn phát triển app',
      image: null, // Fallback profile vector graphic styled beautifully
      author: {
        name: 'Duyên',
        verified: true,
        rating: 4.5,
        avatar: 'D',
      },
      location: 'Gò Vấp',
      timeLeft: 'Còn 1 ngày, 5 giờ',
      tags: [
        { label: 'UI/UX', type: 'skills', icon: 'globe-outline' },
        { label: '500', type: 'points', icon: 'logo-usd' },
      ],
      price: '1.000.000đ',
    },
  ];

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
              <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
                <Ionicons name="search-outline" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} style={[styles.iconButton, styles.notificationBtn]}>
                <Ionicons name="notifications-outline" size={24} color="#FFF" />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Selectors / Dropdowns Row */}
          <View style={styles.selectorsRow}>
            <TouchableOpacity activeOpacity={0.8} style={styles.selectorDropdown}>
              <Text style={styles.selectorText}>Chọn lĩnh vực</Text>
              <Ionicons name="chevron-down" size={14} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.selectorDropdown}>
              <Text style={styles.selectorText}>Chọn địa điểm</Text>
              <Ionicons name="chevron-down" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Floating Actions Overlap Card */}
          <View style={[styles.overlapCard, isDark && styles.overlapCardDark]}>
            <View style={styles.actionGrid}>
              {/* Lụm lúa */}
              <TouchableOpacity activeOpacity={0.7} style={styles.actionItem}>
                <View style={styles.badgeWrapper}>
                  <View style={[styles.circleIcon, { backgroundColor: '#E6F4FE' }]}>
                    <Text style={styles.dollarSymbol}>$</Text>
                  </View>
                  <View style={styles.hotBadge}>
                    <Text style={styles.hotBadgeText}>Hot</Text>
                  </View>
                </View>
                <Text style={[styles.actionLabel, { color: isDark ? '#FFF' : '#333' }]}>Lụm lúa</Text>
              </TouchableOpacity>

              {/* BXH */}
              <TouchableOpacity activeOpacity={0.7} style={styles.actionItem}>
                <View style={styles.badgeWrapper}>
                  <View style={[styles.circleIcon, { backgroundColor: '#FFEFE6' }]}>
                    <Ionicons name="ribbon-sharp" size={20} color="#FF8A00" />
                  </View>
                  <View style={styles.hotBadge}>
                    <Text style={styles.hotBadgeText}>Hot</Text>
                  </View>
                </View>
                <Text style={[styles.actionLabel, { color: isDark ? '#FFF' : '#333' }]}>BXH</Text>
              </TouchableOpacity>

              {/* eKYC */}
              <TouchableOpacity activeOpacity={0.7} style={styles.actionItem}>
                <View style={[styles.circleIcon, { backgroundColor: '#E0F7F4' }]}>
                  <Ionicons name="card-outline" size={20} color="#00BFA5" />
                </View>
                <Text style={[styles.actionLabel, { color: isDark ? '#FFF' : '#333' }]}>eKYC</Text>
              </TouchableOpacity>

              {/* Ví */}
              <TouchableOpacity activeOpacity={0.7} style={styles.actionItem}>
                <View style={[styles.circleIcon, { backgroundColor: '#F0F0F0' }]}>
                  <Ionicons name="wallet-outline" size={20} color="#757575" />
                </View>
                <Text style={[styles.actionLabel, { color: isDark ? '#FFF' : '#333' }]}>Ví</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Promotion Campaign Banner */}
          <View style={[styles.bannerCard, { backgroundColor: isDark ? '#1C2E3D' : '#EAF4FC' }]}>
            <View style={styles.bannerLeft}>
              <Text style={[styles.bannerTitle, { color: isDark ? '#82C1F5' : '#0B59A4' }]}>
                Thúc đẩy hiệu quả chiến dịch bằng quảng cáo banner trên Small Jobs
              </Text>
              <Text style={[styles.bannerDescription, { color: isDark ? '#A9C6E2' : '#5A6B82' }]}>
                Từ ngày 15/12/2025 đến hết 30/1/2026, Small Jobs cam kết đồng hành cùng Doanh nghiệp trích 15% phí booking quảng cáo đóng góp quỹ MTTQ Việt Nam để giúp đỡ nhiều hoàn cảnh khó khăn dịp Tết 2026.
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
            {['Hot', 'Sắp diễn ra', 'Mới nhất', 'Làm ngay'].map((chip) => {
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
            {jobListings.map((job) => {
              const isBookmarked = bookmarkedJobs.includes(job.id);
              return (
                <TouchableOpacity
                  key={job.id}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/job-details', params: { title: job.title } })}
                  style={[styles.jobCard, isDark ? styles.jobCardDark : styles.jobCardLight]}
                >
                  <View style={styles.jobCardTop}>
                    {/* Job Image/Avatar */}
                    {job.image ? (
                      <Image source={job.image} style={styles.jobImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.jobImageFallback, { backgroundColor: isDark ? '#2C2C2E' : '#FFF3E0' }]}>
                        {/* Custom Vector Coder Girl Mock */}
                        <Ionicons name="desktop-outline" size={24} color="#FF9800" />
                      </View>
                    )}

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

                    {/* Highly Tilted Price Bubble */}
                    <View style={[styles.priceBubble, isDark && styles.priceBubbleDark]}>
                      <Text style={styles.priceText}>{job.price}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Safe padding bottom for scrolling */}
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
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,
    transform: [{ rotate: '-3deg' }],
  },
  priceBubbleDark: {
    backgroundColor: '#152E47',
  },
  priceText: {
    color: '#0084FF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scrollPaddingBottom: {
    height: 40,
  },
});
