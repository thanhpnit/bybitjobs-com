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
  Alert,
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

export interface FeaturedCompany {
  id: string;
  name: string;
  logo: string;
  coverImage: string;
  industry: string;
  scale: string;
  location: string;
  description: string;
  benefits: string[];
  rating: number;
}

const featuredCompanies: FeaturedCompany[] = [
  {
    id: 'bybit-vietnam',
    name: 'Công ty Công nghệ Bybit Việt Nam',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=60',
    industry: 'Công nghệ thông tin / Phần mềm',
    scale: '100 - 500 nhân viên',
    location: 'Tòa nhà Landmark 81, Bình Thạnh, TP. HCM',
    description: 'Bybit Việt Nam tự hào là môi trường công nghệ tiên phong, năng động, khuyến khích sự sáng tạo vượt bậc của từng cá nhân.',
    benefits: [
      'Lương thưởng cạnh tranh, review lương 2 lần/năm',
      'Đóng bảo hiểm full 100% lương thực nhận',
      'Thưởng tháng 13 & các gói Performance bonus hấp dẫn',
      'Gói chăm sóc sức khỏe cao cấp Bybit Care hàng năm',
      'Cung cấp Macbook Pro/Dell XPS đời mới khi làm việc',
      'Miễn phí cơm trưa, Pantry ngập tràn đồ ăn nhẹ & nước uống'
    ],
    rating: 4.9,
  },
  {
    id: 'techvibe-solutions',
    name: 'TechVibe Solutions',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&auto=format&fit=crop&q=60',
    coverImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=500&auto=format&fit=crop&q=60',
    industry: 'UI/UX & Fintech Products',
    scale: '50 - 150 nhân viên',
    location: 'Quận 7, TP. Hồ Chí Minh',
    description: 'TechVibe Solutions đi đầu trong việc thiết kế sản phẩm tài chính hiện đại và ứng dụng công nghệ khối chuỗi.',
    benefits: [
      'Lương tháng 13 + Thưởng KPI năm cực cao',
      'Chế độ Hybrid work linh hoạt (lên văn phòng 3 ngày/tuần)',
      'Bảo hiểm PVI hỗ trợ toàn diện gia đình',
      'Hỗ trợ chi phí học tập & nâng cao kỹ năng lên tới 20M/năm',
      'Teambuilding và du lịch nước ngoài hàng năm'
    ],
    rating: 4.8,
  },
  {
    id: 'innovate-studio',
    name: 'Innovate Studio',
    logo: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?w=100&auto=format&fit=crop&q=60',
    coverImage: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=500&auto=format&fit=crop&q=60',
    industry: 'Thiết kế & Smart Home IoT',
    scale: '30 - 80 nhân viên',
    location: 'Quận 3, TP. Hồ Chí Minh',
    description: 'Nơi hội tụ những nhà thiết kế sản phẩm và kỹ sư IoT tài năng để kiến tạo cuộc sống thông minh tương lai.',
    benefits: [
      'Môi trường làm việc mở, tự do sáng tạo, không OT',
      'Đóng bảo hiểm xã hội đầy đủ theo Luật Lao động',
      'Review lương định kỳ hàng năm',
      'Môi trường đa văn hóa, thường xuyên giao tiếp tiếng Anh',
      'Câu lạc bộ thể thao (Bóng đá, Cầu lông...) công ty tài trợ'
    ],
    rating: 5.0,
  }
];

function CandidateHomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { jobs, userData, invitations, respondToInvitation, savedJobs, viewedJobs } = useAuth();

  const pendingInvites = React.useMemo(() => {
    if (!userData?.uid) return [];
    return invitations.filter(
      (inv) =>
        inv.status === 'Pending' &&
        (inv.candidateId === userData.uid ||
         inv.candidateId === 'candidate-1' ||
         inv.candidateId === 'candidate-2' ||
         inv.candidateId === 'candidate-3' ||
         inv.candidateId === 'candidate-4')
    );
  }, [invitations, userData?.uid]);

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

  const [activeChip, setActiveChip] = React.useState('Nổi bật');
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
  const [selectedCompany, setSelectedCompany] = React.useState<FeaturedCompany | null>(null);
  const [isCompanyModalVisible, setIsCompanyModalVisible] = React.useState(false);

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

  const openJobs = jobs.filter(job => job.isOpen !== false && job.status === 'Hoạt động');
  const jobListings: JobItem[] = openJobs.map(job => {
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

  const aiRecommendedJobs = React.useMemo(() => {
    if (!userData?.uid) return [];

    // 1. Target desired job keywords
    const desired = (userData.desiredJob || '').toLowerCase().trim();
    const desiredKeywords = desired.split(' ').filter(word => word.length > 2);

    // 2. Target CV keywords
    const cvName = (userData.cvName || '').toLowerCase().trim();
    const cvKeywords = cvName.replace('.pdf', '').split(/[_\s-]/).filter(word => word.length > 2);

    // 3. Target recently viewed and saved job titles
    const viewedTitles = (viewedJobs || []).map(v => v.jobTitle.toLowerCase());
    const savedTitles = (savedJobs || []).map(s => s.jobTitle.toLowerCase());

    const scored = jobListings.map(job => {
      let score = 0;
      let reasons: string[] = [];
      const title = job.title.toLowerCase();
      const industry = (job.originalIndustry || '').toLowerCase();

      // Check desiredJob keywords
      if (desired) {
        let matchCount = 0;
        desiredKeywords.forEach(kw => {
          if (title.includes(kw)) {
            matchCount++;
          }
        });
        if (matchCount > 0) {
          score += 30 + matchCount * 5;
          reasons.push('Khớp với công việc mong muốn của bạn');
        }
      }

      // Check CV keywords
      if (cvKeywords.length > 0) {
        let matchCount = 0;
        cvKeywords.forEach(kw => {
          if (title.includes(kw)) {
            matchCount++;
          }
        });
        if (matchCount > 0) {
          score += 15 + matchCount * 3;
          reasons.push('Phù hợp với chuyên môn trong CV của bạn');
        }
      }

      // Check viewed history (similarity with recently viewed jobs)
      let viewMatch = false;
      viewedTitles.forEach(vt => {
        if (title.includes(vt) || vt.includes(title)) {
          viewMatch = true;
        }
      });
      if (viewMatch) {
        score += 20;
        reasons.push('Tương tự với các công việc bạn vừa xem');
      }

      // Check saved history
      let saveMatch = false;
      savedTitles.forEach(st => {
        if (title.includes(st) || st.includes(title)) {
          saveMatch = true;
        }
      });
      if (saveMatch) {
        score += 25;
        reasons.push('Phù hợp với các công việc đã lưu');
      }

      // If industry matches CV or desiredJob keywords
      if (industry && (desired.includes(industry) || industry.includes(desired))) {
        score += 10;
      }

      // Calculate percentage match (cap at 99%)
      const matchPercentage = Math.min(Math.max(Math.round((score / 90) * 100), 45), 99);

      return {
        ...job,
        score,
        matchPercentage,
        reason: reasons[0] || 'Gợi ý dựa trên hồ sơ của bạn',
      };
    });

    // Filter jobs with a meaningful match score and sort descending
    return scored
      .filter(item => item.score > 25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Get top 3 recommendations
  }, [jobListings, userData?.desiredJob, userData?.cvName, viewedJobs, savedJobs, userData?.uid]);

  const [searchLocationFilter, setSearchLocationFilter] = React.useState('Tất cả');
  const [searchSalaryFilter, setSearchSalaryFilter] = React.useState('Tất cả');
  const [searchTypeFilter, setSearchTypeFilter] = React.useState('Tất cả');

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const searchSuggestions = React.useMemo(() => {
    const keyword = normalizeText(searchQuery.trim());
    
    const isFilterActive = searchLocationFilter !== 'Tất cả' || 
                           searchSalaryFilter !== 'Tất cả' || 
                           searchTypeFilter !== 'Tất cả';
    
    if (!keyword && !isFilterActive) return [];

    return jobListings
      .filter((job) => {
        // 1. Text keyword search
        let matchKeyword = true;
        if (keyword) {
          const searchableText = normalizeText([
            job.title,
            job.author.name,
            job.location,
            job.price,
            job.originalIndustry || '',
          ].join(' '));
          matchKeyword = searchableText.includes(keyword);
        }

        // 2. Location filter
        let matchLoc = true;
        if (searchLocationFilter !== 'Tất cả') {
          matchLoc = job.location.includes(searchLocationFilter);
        }

        // 3. Salary filter
        let matchSal = true;
        if (searchSalaryFilter !== 'Tất cả') {
          const salaryStr = job.price.toLowerCase();
          let parsedMax = 0;
          let parsedMin = 0;
          
          const matchNum = salaryStr.match(/\d+/g);
          if (matchNum) {
            const numbers = matchNum.map(Number);
            if (numbers.length === 1) {
              parsedMax = numbers[0];
              parsedMin = numbers[0];
            } else if (numbers.length >= 2) {
              parsedMin = numbers[0];
              parsedMax = numbers[1];
            }
          }

          if (searchSalaryFilter === 'Dưới 10 triệu') {
            matchSal = parsedMax < 10 && parsedMax > 0;
          } else if (searchSalaryFilter === '10 - 20 triệu') {
            matchSal = (parsedMin >= 10 && parsedMin <= 20) || (parsedMax >= 10 && parsedMax <= 20);
          } else if (searchSalaryFilter === 'Trên 20 triệu') {
            matchSal = parsedMax > 20 || parsedMin > 20 || salaryStr.includes('thỏa thuận') || salaryStr.includes('cạnh tranh');
          }
        }

        // 4. Job Type filter
        let matchType = true;
        if (searchTypeFilter !== 'Tất cả') {
          const title = job.title.toLowerCase();
          if (searchTypeFilter === 'Thực tập') {
            matchType = title.includes('thực tập') || title.includes('intern') || title.includes('trainee') || title.includes('tts');
          } else if (searchTypeFilter === 'Bán thời gian') {
            matchType = title.includes('part-time') || title.includes('part time') || title.includes('bán thời gian') || title.includes('ca ');
          } else if (searchTypeFilter === 'Toàn thời gian') {
            matchType = !title.includes('thực tập') && !title.includes('intern') && !title.includes('part-time') && !title.includes('part time');
          }
        }

        return matchKeyword && matchLoc && matchSal && matchType;
      })
      .slice(0, 8);
  }, [jobListings, searchQuery, searchLocationFilter, searchSalaryFilter, searchTypeFilter]);

  const openJobDetails = (job: JobItem) => {
    setIsSearchModalVisible(false);
    setSearchQuery('');
    setSearchLocationFilter('Tất cả');
    setSearchSalaryFilter('Tất cả');
    setSearchTypeFilter('Tất cả');
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
        matchLocation = job.location.includes('Phú Nhuận') || job.location.includes('Gò Vấp') || job.location.includes('Hồ Chí Minh') || job.location.includes('Bình Thạnh') || job.location.includes('Quận 7') || job.location.includes('Quận 3');
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

    // Filter by active category chip
    let matchCategory = true;
    if (activeChip === 'Tuyển gấp') {
      const isUrgent = job.isPremium || 
                       job.title.toLowerCase().includes('gấp') || 
                       job.title.toLowerCase().includes('tuyển gấp') || 
                       job.title.toLowerCase().includes('urgent');
      matchCategory = isUrgent;
    } else if (activeChip === 'Thực tập sinh') {
      const title = job.title.toLowerCase();
      const isIntern = title.includes('thực tập') || 
                       title.includes('intern') || 
                       title.includes('trainee') || 
                       title.includes('fresher') || 
                       title.includes('tts');
      matchCategory = isIntern;
    }

    return matchLocation && matchIndustry && matchCategory;
  }).sort((a, b) => {
    if (activeChip === 'Nổi bật' && a.isPremium !== b.isPremium) {
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
              <View style={styles.iconButton} />
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

          {/* Lời mời tuyển dụng section (nếu có pendingInvites) */}
          {pendingInvites.length > 0 && (
            <View style={styles.invitationsSection}>
              <View style={styles.invitationSectionHeader}>
                <Ionicons name="mail-unread-outline" size={20} color="#FF9500" />
                <Text style={[styles.invitationSectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Lời mời tuyển dụng mới ({pendingInvites.length})
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.invitationsList}
              >
                {pendingInvites.map((invite) => (
                  <View
                    key={invite.id}
                    style={[
                      styles.inviteCard,
                      {
                        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
                      },
                    ]}
                  >
                    <View style={styles.inviteCardTop}>
                      <View style={[styles.inviteAvatarCircle, { backgroundColor: isDark ? '#2D2D30' : '#E6F4FE' }]}>
                        <Text style={styles.inviteAvatarText}>
                          {invite.companyName
                            ?.split(' ')
                            .filter(Boolean)
                            .slice(-2)
                            .map((part) => part[0])
                            .join('')
                            .toUpperCase() || '🏢'}
                        </Text>
                      </View>
                      <View style={styles.inviteTextContent}>
                        <Text style={[styles.inviteJobTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                          {invite.jobTitle}
                        </Text>
                        <Text style={styles.inviteCompanyName} numberOfLines={1}>
                          {invite.companyName}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.inviteCardBottom}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRespond(invite.id, 'Declined', invite.jobTitle)}
                        style={[styles.inviteBtn, styles.inviteDeclineBtn, { borderColor: isDark ? '#444' : '#E5E7EB' }]}
                      >
                        <Text style={styles.inviteDeclineBtnText}>✕ Từ chối</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleRespond(invite.id, 'Accepted', invite.jobTitle)}
                        style={[styles.inviteBtn, styles.inviteAcceptBtn]}
                      >
                        <Text style={styles.inviteAcceptBtnText}>✓ Đồng ý</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

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

          {/* TOPPY AI Job Recommendations (Hiển thị nếu có aiRecommendedJobs) */}
          {aiRecommendedJobs.length > 0 && (
            <View style={styles.aiRecommendedSection}>
              <View style={styles.aiSectionHeader}>
                <Ionicons name="sparkles" size={18} color="#0084FF" />
                <Text style={[styles.aiSectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                  Việc làm đề xuất từ TOPPY AI
                </Text>
                <View style={styles.aiHeaderBadge}>
                  <Text style={styles.aiHeaderBadgeText}>Đề xuất cho bạn</Text>
                </View>
              </View>
              <Text style={[styles.aiSectionDesc, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                Hệ thống AI tự động phân tích CV, công việc mong muốn & hành vi của bạn để gợi ý.
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.aiJobsScrollList}
              >
                {aiRecommendedJobs.map((job) => (
                  <TouchableOpacity
                    key={`ai-${job.id}`}
                    activeOpacity={0.9}
                    onPress={() => openJobDetails(job)}
                    style={[
                      styles.aiJobCard,
                      {
                        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
                      },
                    ]}
                  >
                    <View style={styles.aiCardTop}>
                      {/* Avatar */}
                      <View style={[styles.aiJobAvatar, { backgroundColor: isDark ? '#2D2D30' : '#E6F4FE' }]}>
                        <Text style={styles.aiJobAvatarText}>{job.author.avatar}</Text>
                      </View>
                      
                      {/* Job details */}
                      <View style={styles.aiJobTextWrapper}>
                        <Text style={[styles.aiJobTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                          {job.title}
                        </Text>
                        <Text style={styles.aiCompanyName} numberOfLines={1}>
                          {job.author.name}
                        </Text>
                      </View>
                    </View>

                    {/* Fit percentage indicator */}
                    <View style={styles.fitProgressContainer}>
                      <View style={styles.fitProgressHeader}>
                        <Text style={styles.fitReasonText} numberOfLines={1}>🎯 {job.reason}</Text>
                        <Text style={styles.fitPercentageText}>Độ khớp {job.matchPercentage}%</Text>
                      </View>
                      <View style={[styles.fitProgressBarBg, { backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
                        <View
                          style={[
                            styles.fitProgressBarFill,
                            {
                              width: `${job.matchPercentage}%`,
                              backgroundColor: job.matchPercentage > 80 ? '#2E7D32' : '#0084FF',
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Metadata (Salary, Location) */}
                    <View style={styles.aiCardMeta}>
                      <Text style={[styles.aiMetaText, { color: isDark ? '#AAA' : '#687076' }]} numberOfLines={1}>
                        💰 {job.price}
                      </Text>
                      <Text style={[styles.aiMetaText, { color: isDark ? '#AAA' : '#687076' }]} numberOfLines={1}>
                        📍 {job.location}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Featured Companies Section (Thương hiệu nổi bật) */}
          <View style={styles.featuredCompaniesSection}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="business" size={18} color="#FF9500" />
              <Text style={[styles.sectionTitleText, { color: isDark ? '#FFF' : '#11181C' }]}>
                Thương hiệu tuyển dụng nổi bật
              </Text>
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>Premium</Text>
              </View>
            </View>
            <Text style={[styles.sectionDescText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
              Khám phá môi trường làm việc, chế độ đãi ngộ & vị trí đang tuyển dụng hot.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.companiesScrollList}
            >
              {featuredCompanies.map((company) => {
                // Count matching jobs dynamically
                const matchingJobsCount = jobListings.filter(job => {
                  const author = job.author.name.toLowerCase();
                  const comp = company.name.toLowerCase();
                  return author.includes(comp) || comp.includes(author);
                }).length;

                return (
                  <TouchableOpacity
                    key={company.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedCompany(company);
                      setIsCompanyModalVisible(true);
                    }}
                    style={[
                      styles.companyCard,
                      {
                        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                        borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
                      },
                    ]}
                  >
                    <Image source={{ uri: company.coverImage }} style={styles.companyCardCover} />
                    <View style={styles.companyCardContent}>
                      <Image source={{ uri: company.logo }} style={styles.companyCardLogo} />
                      <Text style={[styles.companyCardName, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                        {company.name}
                      </Text>
                      <Text style={styles.companyCardMeta} numberOfLines={1}>
                        ⭐ {company.rating} • {company.scale}
                      </Text>
                      <Text style={[styles.companyCardLocation, { color: isDark ? '#AAA' : '#687076' }]} numberOfLines={1}>
                        📍 {company.location.split(',').slice(-2).join(',').trim()}
                      </Text>
                      <View style={styles.companyCardBottom}>
                        <Text style={styles.jobCountText}>{matchingJobsCount} vị trí đang tuyển</Text>
                        <Ionicons name="arrow-forward" size={14} color="#0084FF" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Filter Chips ScrollView */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {['Nổi bật', 'Tuyển gấp', 'Thực tập sinh', 'Mới nhất'].map((chip) => {
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

      {/* Company Details Modal */}
      <Modal
        visible={isCompanyModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsCompanyModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#151718' : '#F4F5F7' }}>
          {selectedCompany && (
            <View style={{ flex: 1 }}>
              {/* Cover Image & Back Button */}
              <View style={{ height: 160, position: 'relative' }}>
                <Image source={{ uri: selectedCompany.coverImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsCompanyModalVisible(false)}
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Logo overlap & Company Header */}
              <View style={{ paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: -35, marginBottom: 12 }}>
                  <Image
                    source={{ uri: selectedCompany.logo }}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 12,
                      borderWidth: 3,
                      borderColor: isDark ? '#1C1C1E' : '#FFF',
                      backgroundColor: '#FFF',
                    }}
                  />
                  <View style={{ marginLeft: 12, flex: 1, paddingBottom: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C', flex: 1 }} numberOfLines={1}>
                        {selectedCompany.name}
                      </Text>
                      <Ionicons name="checkmark-circle" size={16} color="#0084FF" />
                    </View>
                    <Text style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>{selectedCompany.industry}</Text>
                  </View>
                </View>

                {/* Quick Meta */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="people-outline" size={14} color="#8E8E93" />
                    <Text style={{ fontSize: 11, color: '#8E8E93' }}>{selectedCompany.scale}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="location-outline" size={14} color="#8E8E93" />
                    <Text style={{ fontSize: 11, color: '#8E8E93', maxWidth: 180 }} numberOfLines={1}>
                      {selectedCompany.location.split(',').slice(-2).join(',').trim()}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={14} color="#FFB300" />
                    <Text style={{ fontSize: 11, color: isDark ? '#FFF' : '#11181C', fontWeight: 'bold' }}>
                      {selectedCompany.rating}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Custom Segmented Tabs */}
              {(() => {
                const [activeSubTab, setActiveSubTab] = React.useState<'overview' | 'jobs'>('overview');
                const matchingJobs = jobListings.filter(job => {
                  const author = job.author.name.toLowerCase();
                  const comp = selectedCompany.name.toLowerCase();
                  return author.includes(comp) || comp.includes(author);
                });

                return (
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', height: 44, borderBottomWidth: 1, borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1', backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveSubTab('overview')}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottomWidth: 2,
                          borderBottomColor: activeSubTab === 'overview' ? '#0084FF' : 'transparent',
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: activeSubTab === 'overview' ? '#0084FF' : (isDark ? '#9BA1A6' : '#687076') }}>
                          Môi trường & Phúc lợi
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setActiveSubTab('jobs')}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderBottomWidth: 2,
                          borderBottomColor: activeSubTab === 'jobs' ? '#0084FF' : 'transparent',
                        }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: 'bold', color: activeSubTab === 'jobs' ? '#0084FF' : (isDark ? '#9BA1A6' : '#687076') }}>
                          Vị trí đang tuyển ({matchingJobs.length})
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                      {activeSubTab === 'overview' ? (
                        <View>
                          {/* Description */}
                          <View style={{ padding: 14, borderRadius: 12, backgroundColor: isDark ? '#1C1C1E' : '#FFF', marginBottom: 16, borderWidth: 1, borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C', marginBottom: 8 }}>
                              Về doanh nghiệp
                            </Text>
                            <Text style={{ fontSize: 13, color: isDark ? '#9BA1A6' : '#687076', lineHeight: 18 }}>
                              {selectedCompany.description}
                            </Text>
                          </View>

                          {/* Address details */}
                          <View style={{ padding: 14, borderRadius: 12, backgroundColor: isDark ? '#1C1C1E' : '#FFF', marginBottom: 16, borderWidth: 1, borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#FFF' : '#11181C', marginBottom: 4 }}>
                              📍 ĐỊA CHỈ TRỤ SỞ
                            </Text>
                            <Text style={{ fontSize: 12, color: isDark ? '#9BA1A6' : '#687076' }}>
                              {selectedCompany.location}
                            </Text>
                          </View>

                          {/* Benefits list */}
                          <View style={{ padding: 14, borderRadius: 12, backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderWidth: 1, borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C', marginBottom: 10 }}>
                              🎁 Quyền lợi & Chế độ đãi ngộ
                            </Text>
                            {selectedCompany.benefits.map((benefit, index) => (
                              <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 5, gap: 8 }}>
                                <Ionicons name="checkmark-circle" size={16} color="#2E7D32" style={{ marginTop: 1 }} />
                                <Text style={{ flex: 1, fontSize: 12, color: isDark ? '#ECEDEE' : '#333', lineHeight: 16 }}>
                                  {benefit}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : (
                        <View style={{ gap: 12 }}>
                          {matchingJobs.length === 0 ? (
                            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                              <Ionicons name="briefcase-outline" size={44} color="#8E8E93" />
                              <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 10, textAlign: 'center' }}>
                                Hiện tại doanh nghiệp chưa đăng tuyển vị trí mới nào.
                              </Text>
                            </View>
                          ) : (
                            matchingJobs.map((job) => (
                              <TouchableOpacity
                                key={job.id}
                                activeOpacity={0.8}
                                onPress={() => {
                                  setIsCompanyModalVisible(false);
                                  openJobDetails(job);
                                }}
                                style={{
                                  padding: 14,
                                  borderRadius: 12,
                                  backgroundColor: isDark ? '#1C1C1E' : '#FFF',
                                  borderWidth: 1,
                                  borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
                                }}
                              >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C', flex: 1, marginRight: 8 }}>
                                    {job.title}
                                  </Text>
                                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0084FF' }}>
                                    {job.price}
                                  </Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center' }}>
                                  <Text style={{ fontSize: 11, color: '#8E8E93' }}>📍 {job.location}</Text>
                                  <Text style={{ fontSize: 11, color: '#8E8E93' }}>•</Text>
                                  <Text style={{ fontSize: 11, color: '#8E8E93' }}>{job.timeLeft.split(':')[1]?.trim() || job.timeLeft}</Text>
                                </View>
                              </TouchableOpacity>
                            ))
                          )}
                        </View>
                      )}
                    </ScrollView>
                  </View>
                );
              })()}
            </View>
          )}
        </SafeAreaView>
      </Modal>

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

            {/* Advanced Filters Row */}
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1' }}>
              {/* Location Filter */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert(
                    'Chọn địa điểm',
                    'Lọc tin tuyển dụng theo địa chỉ thành phố',
                    [
                      { text: 'Tất cả địa điểm', onPress: () => setSearchLocationFilter('Tất cả') },
                      { text: 'TP. Hồ Chí Minh', onPress: () => setSearchLocationFilter('Hồ Chí Minh') },
                      { text: 'Hà Nội', onPress: () => setSearchLocationFilter('Hà Nội') },
                      { text: 'Đà Nẵng', onPress: () => setSearchLocationFilter('Đà Nẵng') },
                      { text: 'Hủy', style: 'cancel' }
                    ]
                  );
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: searchLocationFilter !== 'Tất cả' ? '#E6F4FE' : (isDark ? '#2C2C2E' : '#F2F2F7'),
                  borderWidth: 1,
                  borderColor: searchLocationFilter !== 'Tất cả' ? '#0084FF' : 'transparent',
                  gap: 4,
                }}
              >
                <Ionicons name="location-outline" size={14} color={searchLocationFilter !== 'Tất cả' ? '#0084FF' : '#8E8E93'} />
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: searchLocationFilter !== 'Tất cả' ? '#0084FF' : (isDark ? '#FFF' : '#11181C') }} numberOfLines={1}>
                  {searchLocationFilter === 'Tất cả' ? 'Địa điểm' : searchLocationFilter}
                </Text>
              </TouchableOpacity>

              {/* Salary Filter */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert(
                    'Chọn khoảng lương',
                    'Lọc tin tuyển dụng theo ngân sách mong muốn',
                    [
                      { text: 'Tất cả mức lương', onPress: () => setSearchSalaryFilter('Tất cả') },
                      { text: 'Dưới 10 triệu', onPress: () => setSearchSalaryFilter('Dưới 10 triệu') },
                      { text: '10 - 20 triệu', onPress: () => setSearchSalaryFilter('10 - 20 triệu') },
                      { text: 'Trên 20 triệu', onPress: () => setSearchSalaryFilter('Trên 20 triệu') },
                      { text: 'Hủy', style: 'cancel' }
                    ]
                  );
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: searchSalaryFilter !== 'Tất cả' ? '#E6F4FE' : (isDark ? '#2C2C2E' : '#F2F2F7'),
                  borderWidth: 1,
                  borderColor: searchSalaryFilter !== 'Tất cả' ? '#0084FF' : 'transparent',
                  gap: 4,
                }}
              >
                <Ionicons name="cash-outline" size={14} color={searchSalaryFilter !== 'Tất cả' ? '#0084FF' : '#8E8E93'} />
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: searchSalaryFilter !== 'Tất cả' ? '#0084FF' : (isDark ? '#FFF' : '#11181C') }} numberOfLines={1}>
                  {searchSalaryFilter === 'Tất cả' ? 'Mức lương' : searchSalaryFilter}
                </Text>
              </TouchableOpacity>

              {/* Job Type Filter */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  Alert.alert(
                    'Chọn hình thức',
                    'Lọc tin tuyển dụng theo thời gian làm việc',
                    [
                      { text: 'Tất cả hình thức', onPress: () => setSearchTypeFilter('Tất cả') },
                      { text: 'Toàn thời gian', onPress: () => setSearchTypeFilter('Toàn thời gian') },
                      { text: 'Bán thời gian', onPress: () => setSearchTypeFilter('Bán thời gian') },
                      { text: 'Thực tập', onPress: () => setSearchTypeFilter('Thực tập') },
                      { text: 'Hủy', style: 'cancel' }
                    ]
                  );
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: searchTypeFilter !== 'Tất cả' ? '#E6F4FE' : (isDark ? '#2C2C2E' : '#F2F2F7'),
                  borderWidth: 1,
                  borderColor: searchTypeFilter !== 'Tất cả' ? '#0084FF' : 'transparent',
                  gap: 4,
                }}
              >
                <Ionicons name="time-outline" size={14} color={searchTypeFilter !== 'Tất cả' ? '#0084FF' : '#8E8E93'} />
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: searchTypeFilter !== 'Tất cả' ? '#0084FF' : (isDark ? '#FFF' : '#11181C') }} numberOfLines={1}>
                  {searchTypeFilter === 'Tất cả' ? 'Hình thức' : searchTypeFilter}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.searchResultsList}>
              {searchQuery.trim().length === 0 ? (
                <View style={{ padding: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C', marginBottom: 12 }}>
                    🔥 Từ khóa phổ biến
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {['React Native', 'Figma', 'Marketing', 'Thực tập sinh', 'Designer', 'Android', 'Kinh doanh', 'Phần mềm'].map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        activeOpacity={0.8}
                        onPress={() => setSearchQuery(tag)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 20,
                          backgroundColor: isDark ? '#2C2C2E' : '#ECEFF1',
                        }}
                      >
                        <Text style={{ fontSize: 12, color: isDark ? '#FFF' : '#11181C', fontWeight: '500' }}>
                          #{tag}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ marginTop: 24, padding: 14, borderRadius: 12, backgroundColor: isDark ? '#2C2C2E' : '#EBF5FF' }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0084FF', marginBottom: 4 }}>
                      💡 Tìm kiếm thông minh
                    </Text>
                    <Text style={{ fontSize: 11, color: isDark ? '#AAA' : '#687076', lineHeight: 16 }}>
                      Sử dụng các bộ lọc địa điểm, khoảng lương và hình thức làm việc bên trên thanh tìm kiếm để lọc chính xác kết quả.
                    </Text>
                  </View>
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
  invitationsSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  invitationSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  invitationSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  invitationsList: {
    paddingRight: 16,
    gap: 12,
  },
  inviteCard: {
    width: 280,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  inviteCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inviteAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteAvatarText: {
    color: '#0084FF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  inviteTextContent: {
    flex: 1,
  },
  inviteJobTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  inviteCompanyName: {
    fontSize: 11,
    color: '#0084FF',
    fontWeight: '600',
  },
  inviteCardBottom: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 10,
  },
  inviteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteDeclineBtn: {
    backgroundColor: 'transparent',
  },
  inviteDeclineBtnText: {
    color: '#FF3B30',
    fontSize: 11,
    fontWeight: 'bold',
  },
  inviteAcceptBtn: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  inviteAcceptBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  aiRecommendedSection: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  aiSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  aiHeaderBadge: {
    backgroundColor: '#E6F4FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  aiHeaderBadgeText: {
    color: '#0084FF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  aiSectionDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12,
  },
  aiJobsScrollList: {
    paddingRight: 16,
    gap: 12,
  },
  aiJobCard: {
    width: 290,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  aiCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiJobAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiJobAvatarText: {
    color: '#0084FF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  aiJobTextWrapper: {
    flex: 1,
  },
  aiJobTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  aiCompanyName: {
    fontSize: 11,
    color: '#0084FF',
    fontWeight: '600',
  },
  fitProgressContainer: {
    marginTop: 12,
  },
  fitProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fitReasonText: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
    flex: 1,
    marginRight: 6,
  },
  fitPercentageText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  fitProgressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fitProgressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  aiCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 10,
  },
  aiMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  featuredCompaniesSection: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  premiumBadge: {
    backgroundColor: '#FFEFE6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  premiumBadgeText: {
    color: '#FF8A00',
    fontSize: 9,
    fontWeight: 'bold',
  },
  sectionDescText: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 12,
  },
  companiesScrollList: {
    paddingRight: 16,
    gap: 12,
  },
  companyCard: {
    width: 200,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  companyCardCover: {
    height: 70,
    width: '100%',
  },
  companyCardContent: {
    padding: 10,
    alignItems: 'center',
    position: 'relative',
    paddingTop: 24,
  },
  companyCardLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: '#FFF',
    position: 'absolute',
    top: -22,
  },
  companyCardName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  companyCardMeta: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
  },
  companyCardLocation: {
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  companyCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 8,
  },
  jobCountText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0084FF',
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
