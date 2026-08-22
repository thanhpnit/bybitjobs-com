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
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { useAuth, checkIsJobExpired, formatDeadlineDisplay, getEmployerPackageTier, isPremiumEmployer, isProEmployer } from '@/hooks/use-auth';



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
  employerId?: string;
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

const DEFAULT_COMPANY_LOGO = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&auto=format&fit=crop&q=60';
const DEFAULT_COMPANY_COVER = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=60';

const buildFeaturedCompany = (employerData: any, employerId: string, fallbackName?: string): FeaturedCompany => {
  const companyName =
    employerData?.companyName ||
    employerData?.company_name ||
    employerData?.company ||
    employerData?.name ||
    fallbackName ||
    'Doanh nghiệp tuyển dụng';
  const safeCompanyName = String(companyName).trim();

  let scale = employerData?.scale || employerData?.companySize || employerData?.size || '';
  if (!scale || scale.includes('cập nhật')) {
    scale = '50 - 200 nhân viên';
  }

  let industry = employerData?.industry || employerData?.businessField || '';
  if (!industry || industry.includes('cập nhật')) {
    industry = 'Công nghệ & Dịch vụ';
  }

  let location = employerData?.address || employerData?.location || '';
  if (!location || location.includes('cập nhật')) {
    location = 'Quận 1, TP. Hồ Chí Minh';
  }

  let description = employerData?.description || employerData?.about || '';
  if (!description || description.trim().length < 15 || description.includes('cập nhật')) {
    description = `${safeCompanyName} là đơn vị tuyển dụng uy tín hàng đầu trên BybitJobs. Chúng tôi định hướng phát triển môi trường làm việc hiện đại, minh bạch, coi trọng giá trị con người và liên tục tạo điều kiện để nhân sự nâng cao năng lực chuyên môn.`;
  }

  return {
    id: employerId,
    employerId,
    name: safeCompanyName,
    logo: (employerData?.logoUrl || employerData?.logo_url || employerData?.logo || '').length > 5
      ? (employerData.logoUrl || employerData.logo_url || employerData.logo)
      : DEFAULT_COMPANY_LOGO,
    coverImage: (employerData?.coverImage || employerData?.cover_image || '').length > 5
      ? (employerData.coverImage || employerData.cover_image)
      : DEFAULT_COMPANY_COVER,
    industry,
    scale,
    location,
    description,
    benefits: Array.isArray(employerData?.benefits) && employerData.benefits.length > 0
      ? employerData.benefits
      : [
          'Môi trường làm việc năng động, sáng tạo và chế độ đãi ngộ cạnh tranh',
          'Thưởng hiệu quả công việc hàng quý và chế độ bảo hiểm đầy đủ',
          'Chương trình đào tạo kỹ năng chuyên sâu và du lịch teambuilding hằng năm'
        ],
    rating: Number(employerData?.rating || employerData?.averageRating || 4.9),
  };
};

interface CompanyDetailsContentProps {
  selectedCompany: FeaturedCompany;
  isDark: boolean;
  jobListings: JobItem[];
  setIsCompanyModalVisible: (visible: boolean) => void;
  openJobDetails: (job: JobItem) => void;
}

function CompanyDetailsContent({
  selectedCompany,
  isDark,
  jobListings,
  setIsCompanyModalVisible,
  openJobDetails,
}: CompanyDetailsContentProps) {
  const [activeSubTab, setActiveSubTab] = React.useState<'overview' | 'jobs'>('overview');
  const matchingJobs = React.useMemo(() => {
    return jobListings.filter(job => {
      const author = job.author.name.toLowerCase();
      const comp = selectedCompany.name.toLowerCase();
      return author.includes(comp) || comp.includes(author);
    });
  }, [jobListings, selectedCompany.name]);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 9999, justifyContent: 'flex-end' }]}>
      <View style={{
        backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '88%',
        minHeight: '65%',
        overflow: 'hidden',
        borderWidth: 2,
        borderBottomWidth: 0,
        borderColor: '#F59E0B',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
      }}>
        {/* Header Cover Photo with VIP Crown */}
        <View style={{ height: 130, position: 'relative' }}>
          <Image source={{ uri: selectedCompany.coverImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <TouchableOpacity
            onPress={() => setIsCompanyModalVisible(false)}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 20,
              padding: 6,
            }}
          >
            <Ionicons name="close" size={20} color="#FFF" />
          </TouchableOpacity>

          {/* VIP Crown Floating Badge */}
          <View style={{
            position: 'absolute',
            top: 14,
            left: 14,
            backgroundColor: 'rgba(0,0,0,0.75)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderWidth: 1.5,
            borderColor: '#F59E0B',
          }}>
            <Text style={{ fontSize: 13 }}>👑</Text>
            <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '900', letterSpacing: 0.4 }}>DOANH NGHIỆP VIP TOP 1</Text>
          </View>
        </View>

        {/* Company Brief Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 34, position: 'relative', backgroundColor: isDark ? '#1C1917' : '#FFF' }}>
          {/* Logo Avatar */}
          <View style={{
            position: 'absolute',
            top: -30,
            left: 16,
            width: 60,
            height: 60,
            borderRadius: 18,
            borderWidth: 2.5,
            borderColor: '#F59E0B',
            backgroundColor: '#FFF',
            overflow: 'hidden',
            elevation: 6,
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
          }}>
            <Image source={{ uri: selectedCompany.logo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: isDark ? '#FFF' : '#11181C', flex: 1 }} numberOfLines={1}>
              {selectedCompany.name}
            </Text>
            <Ionicons name="checkmark-circle" size={18} color="#0084FF" />
          </View>
          <Text style={{ fontSize: 12, color: '#F59E0B', fontWeight: '700', marginTop: 2 }}>{selectedCompany.industry || 'Thương hiệu Tuyển dụng Hàng đầu'}</Text>

          {/* Quick Meta Row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? '#2C2A24' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Ionicons name="people-outline" size={13} color="#D97706" />
              <Text style={{ fontSize: 11, color: isDark ? '#F59E0B' : '#B45309', fontWeight: '700' }}>{selectedCompany.scale}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? '#252729' : '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Ionicons name="location-outline" size={13} color="#64748B" />
              <Text style={{ fontSize: 11, color: isDark ? '#CBD5E1' : '#475569', maxWidth: 160 }} numberOfLines={1}>
                {selectedCompany.location.split(',').slice(-2).join(',').trim()}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: isDark ? '#2C2A24' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '900' }}>
                {selectedCompany.rating || 5.0} (Bảo chứng VIP 🏆)
              </Text>
            </View>
          </View>
        </View>

        {/* Sub-tabs Navigation */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', height: 44, borderBottomWidth: 1, borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1', backgroundColor: isDark ? '#1C1917' : '#FFFFFF' }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSubTab('overview')}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderBottomWidth: 2,
                borderBottomColor: activeSubTab === 'overview' ? '#F59E0B' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: activeSubTab === 'overview' ? '#F59E0B' : (isDark ? '#9BA1A6' : '#687076') }}>
                Môi trường & Về Doanh Nghiệp
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
                borderBottomColor: activeSubTab === 'jobs' ? '#F59E0B' : 'transparent',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: activeSubTab === 'jobs' ? '#F59E0B' : (isDark ? '#9BA1A6' : '#687076') }}>
                Vị trí tuyển dụng 🔥 ({matchingJobs.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {activeSubTab === 'overview' ? (
              <View>
                {/* VIP Commitment Banner */}
                <View style={{
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: isDark ? '#2C2A24' : '#FEF3C7',
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: isDark ? '#453517' : '#FDE68A',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <Text style={{ fontSize: 22 }}>👑</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '900', color: isDark ? '#F59E0B' : '#B45309' }}>
                      DOANH NGHIỆP PREMIUM BẢO CHỨNG
                    </Text>
                    <Text style={{ fontSize: 11, color: isDark ? '#D97706' : '#92400E', marginTop: 2 }}>
                      Môi trường làm việc đạt tiêu chuẩn chất lượng cao, quy trình phỏng vấn chuyên nghiệp và phản hồi nhanh chóng.
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <View style={{ padding: 14, borderRadius: 14, backgroundColor: isDark ? '#252320' : '#FFF', marginBottom: 14, borderWidth: 1, borderColor: isDark ? '#3D382E' : '#E5E7EB' }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C', marginBottom: 8 }}>
                    🏢 Về doanh nghiệp
                  </Text>
                  <Text style={{ fontSize: 13, color: isDark ? '#CBD5E1' : '#475569', lineHeight: 19 }}>
                    {selectedCompany.description}
                  </Text>
                </View>

                {/* Address details */}
                <View style={{ padding: 14, borderRadius: 14, backgroundColor: isDark ? '#252320' : '#FFF', marginBottom: 14, borderWidth: 1, borderColor: isDark ? '#3D382E' : '#E5E7EB' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFF' : '#11181C', marginBottom: 4 }}>
                    📍 ĐỊA CHỈ TRỤ SỞ CHÍNH
                  </Text>
                  <Text style={{ fontSize: 12, color: isDark ? '#CBD5E1' : '#475569' }}>
                    {selectedCompany.location}
                  </Text>
                </View>

                {/* Benefits list */}
                <View style={{ padding: 14, borderRadius: 14, backgroundColor: isDark ? '#252320' : '#FFF', borderWidth: 1, borderColor: isDark ? '#3D382E' : '#E5E7EB' }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C', marginBottom: 10 }}>
                    🎁 Quyền lợi & Chế độ đãi ngộ VIP
                  </Text>
                  {selectedCompany.benefits.map((benefit, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginVertical: 5, gap: 8 }}>
                      <Ionicons name="checkmark-circle" size={16} color="#F59E0B" style={{ marginTop: 1 }} />
                      <Text style={{ flex: 1, fontSize: 12, color: isDark ? '#ECEDEE' : '#333', lineHeight: 17 }}>
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
                      activeOpacity={0.88}
                      onPress={() => {
                        setIsCompanyModalVisible(false);
                        openJobDetails(job);
                      }}
                      style={{
                        padding: 14,
                        borderRadius: 14,
                        backgroundColor: isDark ? '#252320' : '#FFF',
                        borderWidth: 1.5,
                        borderColor: '#F59E0B',
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text style={{ fontSize: 14, fontWeight: 'bold', color: isDark ? '#FFF' : '#11181C', flex: 1, marginRight: 8 }}>
                          {job.title}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: '#F59E0B' }}>
                          {job.price}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, color: isDark ? '#9BA1A6' : '#64748B' }}>📍 {job.location}</Text>
                        <Text style={{ fontSize: 11, color: isDark ? '#9BA1A6' : '#64748B' }}>•</Text>
                        <Text style={{ fontSize: 11, color: isDark ? '#9BA1A6' : '#64748B' }}>{job.timeLeft.split(':')[1]?.trim() || job.timeLeft}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const checkSalaryMatch = (jobPrice: string, filterSalary: string): boolean => {
  if (
    !filterSalary ||
    filterSalary === 'Chọn mức lương' ||
    filterSalary === 'Chọn lương' ||
    filterSalary === 'Tất cả' ||
    filterSalary === 'Tất cả mức lương'
  ) {
    return true;
  }

  const salaryStr = (jobPrice || '').toLowerCase();

  if (filterSalary === 'Thỏa thuận') {
    return (
      salaryStr.includes('thỏa thuận') ||
      salaryStr.includes('cạnh tranh') ||
      salaryStr.includes('deal') ||
      salaryStr.includes('negotiable')
    );
  }

  const cleanStr = salaryStr.replace(/[,\.]/g, '');
  const regex = /(\d+)\s*(k|tr|triệu|ngàn|nghìn)?/gi;
  let match;
  const numbers: number[] = [];

  while ((match = regex.exec(cleanStr)) !== null) {
    let val = parseFloat(match[1]);
    const unit = (match[2] || '').toLowerCase();
    if (unit === 'k' || unit === 'ngàn' || unit === 'nghìn') {
      val = val / 1000;
    } else if (unit === 'tr' || unit === 'triệu') {
      val = val;
    } else {
      if (val >= 100000) val = val / 1000000;
      else if (val >= 100) val = val / 1000;
    }
    numbers.push(val);
  }

  let parsedMin = 0;
  let parsedMax = 0;
  if (numbers.length === 1) {
    parsedMin = numbers[0];
    parsedMax = numbers[0];
  } else if (numbers.length >= 2) {
    parsedMin = numbers[0];
    parsedMax = numbers[1];
  }

  if (numbers.length === 0) {
    if (salaryStr.includes('thỏa thuận') || salaryStr.includes('cạnh tranh')) {
      return filterSalary === 'Thỏa thuận' || filterSalary === 'Trên 20 triệu' || filterSalary === '15 - 20 triệu' || filterSalary === '10 - 20 triệu';
    }
    return true;
  }

  if (filterSalary === 'Dưới 5 triệu') {
    return parsedMax < 5 && parsedMax > 0;
  }
  if (filterSalary === '5 - 10 triệu') {
    return (parsedMin >= 5 && parsedMin <= 10) || (parsedMax >= 5 && parsedMax <= 10) || (parsedMin < 5 && parsedMax > 10);
  }
  if (filterSalary === 'Dưới 10 triệu') {
    return parsedMax < 10 && parsedMax > 0;
  }
  if (filterSalary === '10 - 15 triệu') {
    return (parsedMin >= 10 && parsedMin <= 15) || (parsedMax >= 10 && parsedMax <= 15) || (parsedMin < 10 && parsedMax > 15);
  }
  if (filterSalary === '10 - 20 triệu') {
    return (parsedMin >= 10 && parsedMin <= 20) || (parsedMax >= 10 && parsedMax <= 20) || (parsedMin < 10 && parsedMax > 20);
  }
  if (filterSalary === '15 - 20 triệu') {
    return (parsedMin >= 15 && parsedMin <= 20) || (parsedMax >= 15 && parsedMax <= 20) || (parsedMin < 15 && parsedMax > 20);
  }
  if (filterSalary === 'Trên 20 triệu') {
    return parsedMax > 20 || parsedMin > 20;
  }

  return true;
};

const checkIndustryMatch = (jobIndustry: string = '', jobTitle: string = '', selectedIndustry: string): boolean => {
  if (!selectedIndustry || selectedIndustry === 'Chọn lĩnh vực' || selectedIndustry === 'Tất cả lĩnh vực') {
    return true;
  }

  const cleanSelected = selectedIndustry.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanJobInd = (jobIndustry || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanJobTitle = (jobTitle || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (jobIndustry === selectedIndustry || cleanJobInd === cleanSelected) {
    return true;
  }

  if (cleanJobInd && (cleanSelected.includes(cleanJobInd) || cleanJobInd.includes(cleanSelected))) {
    return true;
  }

  if (cleanSelected.includes('cong nghe') || cleanSelected.includes('it') || cleanSelected.includes('phan mem')) {
    return cleanJobInd.includes('it') || cleanJobInd.includes('cong nghe') || cleanJobInd.includes('phan mem') ||
           cleanJobTitle.includes('developer') || cleanJobTitle.includes('coder') || cleanJobTitle.includes('lap trinh') || cleanJobTitle.includes('react') || cleanJobTitle.includes('software') || cleanJobTitle.includes('it');
  }

  if (cleanSelected.includes('thiet ke') || cleanSelected.includes('ui/ux')) {
    return cleanJobInd.includes('thiet ke') || cleanJobInd.includes('design') || cleanJobInd.includes('ui/ux') ||
           cleanJobTitle.includes('design') || cleanJobTitle.includes('figma') || cleanJobTitle.includes('thiet ke') || cleanJobTitle.includes('photoshop');
  }

  if (cleanSelected.includes('ban hang') || cleanSelected.includes('tu van') || cleanSelected.includes('sales')) {
    return cleanJobInd.includes('ban hang') || cleanJobInd.includes('sales') || cleanJobInd.includes('kinh doanh') || cleanJobInd.includes('tu van') ||
           cleanJobTitle.includes('sales') || cleanJobTitle.includes('ban hang') || cleanJobTitle.includes('kinh doanh') || cleanJobTitle.includes('tu van');
  }

  if (cleanSelected.includes('nha hang') || cleanSelected.includes('f&b') || cleanSelected.includes('an uong')) {
    return cleanJobInd.includes('nha hang') || cleanJobInd.includes('f&b') || cleanJobInd.includes('pha che') || cleanJobInd.includes('phuc vu') ||
           cleanJobTitle.includes('pha che') || cleanJobTitle.includes('phuc vu') || cleanJobTitle.includes('thu ngan') || cleanJobTitle.includes('barista') || cleanJobTitle.includes('bep');
  }

  if (cleanSelected.includes('giao hang') || cleanSelected.includes('van chuyen') || cleanSelected.includes('van tai')) {
    return cleanJobInd.includes('giao hang') || cleanJobInd.includes('shipper') || cleanJobInd.includes('van chuyen') || cleanJobInd.includes('kho') ||
           cleanJobTitle.includes('shipper') || cleanJobTitle.includes('giao hang') || cleanJobTitle.includes('driver') || cleanJobTitle.includes('tai xe');
  }

  if (cleanSelected.includes('hanh chinh') || cleanSelected.includes('van phong') || cleanSelected.includes('nhan su') || cleanSelected.includes('ke toan')) {
    return cleanJobInd.includes('hanh chinh') || cleanJobInd.includes('van phong') || cleanJobInd.includes('nhan su') || cleanJobInd.includes('ke toan') ||
           cleanJobTitle.includes('hanh chinh') || cleanJobTitle.includes('hr') || cleanJobTitle.includes('ke toan') || cleanJobTitle.includes('tro ly') || cleanJobTitle.includes('admin');
  }

  if (cleanSelected.includes('ky thuat') || cleanSelected.includes('co khi') || cleanSelected.includes('dien')) {
    return cleanJobInd.includes('ky thuat') || cleanJobInd.includes('co khi') || cleanJobInd.includes('dien') || cleanJobInd.includes('bao tri') ||
           cleanJobTitle.includes('ky thuat') || cleanJobTitle.includes('co khi') || cleanJobTitle.includes('sua chua');
  }

  if (cleanSelected.includes('gia su') || cleanSelected.includes('giao duc')) {
    return cleanJobInd.includes('gia su') || cleanJobInd.includes('giao duc') || cleanJobInd.includes('tieng anh') || cleanJobInd.includes('giao vien') ||
           cleanJobTitle.includes('gia su') || cleanJobTitle.includes('giao vien') || cleanJobTitle.includes('tro giang');
  }

  if (cleanSelected.includes('lam dep') || cleanSelected.includes('spa')) {
    return cleanJobInd.includes('lam dep') || cleanJobInd.includes('spa') || cleanJobInd.includes('toc') || cleanJobInd.includes('nail') ||
           cleanJobTitle.includes('spa') || cleanJobTitle.includes('lam dep') || cleanJobTitle.includes('makeup');
  }

  const words = cleanSelected.split(/[\/\s\-\_]+/).filter((w: string) => w.length > 2);
  return words.some((word: string) => cleanJobInd.includes(word) || cleanJobTitle.includes(word));
};

function CompanyLogoAvatar({ logoUri, fallbackText, isDark }: { logoUri?: string; fallbackText?: string; isDark?: boolean }) {
  const [hasError, setHasError] = React.useState(false);

  if (logoUri && String(logoUri).trim().length > 5 && !hasError) {
    return (
      <Image
        source={{ uri: logoUri }}
        style={{ width: 24, height: 24, borderRadius: 12, marginRight: 6 }}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <View style={{
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isDark ? '#334155' : '#E2E8F0',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 6,
    }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#F8FAFC' : '#475569' }}>
        {fallbackText || 'TC'}
      </Text>
    </View>
  );
}

function CandidateHomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { jobs, userData, userDataExtra, employerData, invitations, respondToInvitation, savedJobs, viewedJobs, userRole, applications } = useAuth();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

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
  const [proEmployersById, setProEmployersById] = React.useState<Record<string, boolean>>({});
  const [premiumCompaniesByEmployerId, setPremiumCompaniesByEmployerId] = React.useState<Record<string, FeaturedCompany>>({});

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
          const needsPremiumStatus = premiumEmployersById[job.employerId] === undefined || proEmployersById[job.employerId] === undefined;
          return needsPosterName || needsPremiumStatus;
        })
        .map((job) => job.employerId as string)
    ));

    if (employerIds.length === 0) return;

    const loadPosterNames = async () => {
      const entries = await Promise.all(employerIds.map(async (employerId) => {
        let name: string | undefined;
        let isPremium = false;
        let isPro = false;
        let premiumCompany: FeaturedCompany | undefined;

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
            isPremium = isPremiumEmployer(employerData);
            isPro = isProEmployer(employerData);

            if (isPremium) {
              premiumCompany = buildFeaturedCompany(employerData, employerId, name);
            }
          }
        } catch (error) {
          console.error('Lỗi lấy gói nhà tuyển dụng:', error);
        }

        return { employerId, name, isPremium, isPro, premiumCompany };
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
      const nextProStatuses = Object.fromEntries(
        entries.map((entry) => [entry.employerId, entry.isPro])
      );
      const nextPremiumCompanies = Object.fromEntries(
        entries
          .filter((entry) => !!entry.premiumCompany)
          .map((entry) => [entry.employerId, entry.premiumCompany as FeaturedCompany])
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
      if (Object.keys(nextProStatuses).length > 0) {
        setProEmployersById((prev) => {
          let hasChanged = false;
          const next = { ...prev };
          Object.entries(nextProStatuses).forEach(([employerId, isPro]) => {
            if (next[employerId] !== isPro) {
              next[employerId] = isPro;
              hasChanged = true;
            }
          });
          return hasChanged ? next : prev;
        });
      }
      if (Object.keys(nextPremiumCompanies).length > 0) {
        setPremiumCompaniesByEmployerId((prev) => ({ ...prev, ...nextPremiumCompanies }));
      }
    };

    loadPosterNames();

    return () => {
      isActive = false;
    };
  }, [jobs, posterNamesByEmployerId, premiumEmployersById]);

  React.useEffect(() => {
    let isActive = true;

    const loadPremiumCompanies = async () => {
      try {
        const response = await fetch('http://160.250.246.119:4000/api/employers');
        if (!response.ok) return;

        const data = await response.json();
        const employers = Array.isArray(data) ? data : data?.employers;
        if (!Array.isArray(employers) || !isActive) return;

        const premiumEntries = employers
          .map((employer: any) => {
            const employerId = employer.id || employer.uid || employer.user_id;
            if (!employerId || !isPremiumEmployer(employer)) return null;
            return [String(employerId), buildFeaturedCompany(employer, String(employerId))] as const;
          })
          .filter(Boolean) as [string, FeaturedCompany][];

        if (premiumEntries.length === 0) return;

        setPremiumCompaniesByEmployerId((prev) => ({ ...prev, ...Object.fromEntries(premiumEntries) }));
        setPremiumEmployersById((prev) => {
          const next = { ...prev };
          premiumEntries.forEach(([employerId]) => {
            next[employerId] = true;
          });
          return next;
        });
      } catch (error) {
        console.error('Lỗi lấy danh sách công ty Premium:', error);
      }
    };

    loadPremiumCompanies();

    return () => {
      isActive = false;
    };
  }, []);

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

  const industries = React.useMemo(() => {
    const defaultList = [
      'Tất cả lĩnh vực',
      'Công nghệ thông tin',
      'Bán hàng / Tư vấn',
      'UI/UX / Thiết kế',
      'Hành chính / Văn phòng',
      'Nhà hàng / F&B',
      'Giao hàng / Vận chuyển',
      'Kỹ thuật / Cơ khí',
      'Gia sư / Giáo dục',
      'Dịch vụ làm đẹp',
    ];
    const fetchedIndustries = jobs
      .map((j) => (j.industry || '').trim())
      .filter((ind) => ind && ind !== 'Khác' && !defaultList.includes(ind));

    return Array.from(new Set([...defaultList, ...fetchedIndustries]));
  }, [jobs]);

  const salaryRanges = [
    'Tất cả mức lương',
    'Dưới 5 triệu',
    '5 - 10 triệu',
    '10 - 15 triệu',
    '15 - 20 triệu',
    'Trên 20 triệu',
    'Thỏa thuận'
  ];

  const [selectedLocation, setSelectedLocation] = React.useState('Chọn địa điểm');
  const [isLocationModalVisible, setIsLocationModalVisible] = React.useState(false);
  const [selectedIndustry, setSelectedIndustry] = React.useState('Chọn lĩnh vực');
  const [isIndustryModalVisible, setIsIndustryModalVisible] = React.useState(false);
  const [selectedSalary, setSelectedSalary] = React.useState('Chọn mức lương');
  const [isSalaryModalVisible, setIsSalaryModalVisible] = React.useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCompany, setSelectedCompany] = React.useState<FeaturedCompany | null>(null);
  const [isCompanyModalVisible, setIsCompanyModalVisible] = React.useState(false);
  const [companyModalTab, setCompanyModalTab] = React.useState<'overview' | 'jobs'>('overview');

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

  const openJobs = jobs.filter(job => {
    if (job.isOpen === false) return false;
    if (checkIsJobExpired(job.deadline)) return false;
    const status = (job.status || '').toLowerCase();
    if (status.includes('chờ') || status.includes('từ chối') || status.includes('đóng') || status === 'rejected' || status === 'pending') {
      return false;
    }
    return true;
  });
  const companyRatingsByName = React.useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    (applications || []).forEach((app: any) => {
      const cName = (app.companyName || app.company || '').toLowerCase().trim();
      const r = Number(app.companyRating || 0);
      const status = app.reviewStatus || 'Đã phê duyệt';
      if (cName && r > 0 && status !== 'Bị báo cáo') {
        if (!map[cName]) map[cName] = { sum: 0, count: 0 };
        map[cName].sum += r;
        map[cName].count += 1;
      }
    });
    const result: Record<string, number> = {};
    Object.keys(map).forEach((cName) => {
      result[cName] = Number((map[cName].sum / map[cName].count).toFixed(1));
    });
    return result;
  }, [applications]);

  const getCompanyRating = (posterName: string, defaultRating: number = 5.0) => {
    const key = posterName.toLowerCase().trim();
    if (!key) return defaultRating;
    if (companyRatingsByName[key]) return companyRatingsByName[key];
    for (const [cName, rating] of Object.entries(companyRatingsByName)) {
      if (cName && (cName.includes(key) || key.includes(cName))) {
        return rating;
      }
    }
    return defaultRating;
  };

  const jobListings: JobItem[] = openJobs.map(job => {
    const posterName = getPosterName(job);
    const dynamicRating = getCompanyRating(posterName, Number((job as any).companyRating || 5.0));

    return {
      id: job.id,
      title: job.title,
      image: null,
      author: {
        name: posterName,
        verified: true,
        rating: dynamicRating,
        avatar: getPosterAvatar(posterName),
      },
      location: job.location,
      timeLeft: job.isOpen ? `Hạn chót: ${formatDeadlineDisplay(job.deadline)}` : 'Đã đóng',
      tags: [
        { label: job.industry, type: 'category', icon: 'briefcase-outline' },
      ],
      price: job.salary,
      originalIndustry: job.industry,
      createdAt: job.createdAt,
      isPremium: job.employerId ? premiumEmployersById[job.employerId] === true : false,
    };
  });

  const featuredPremiumCompanies = React.useMemo(() => {
    return Object.values(premiumCompaniesByEmployerId)
      .sort((a, b) => {
        const aJobs = openJobs.filter((job) => job.employerId === a.employerId).length;
        const bJobs = openJobs.filter((job) => job.employerId === b.employerId).length;
        return bJobs - aJobs;
      });
  }, [openJobs, premiumCompaniesByEmployerId]);

  const aiRecommendedJobs = React.useMemo(() => {
    if (!userData?.uid) return [];
    if (!jobListings || jobListings.length === 0) return [];

    const desired = (userData?.desiredJob || '').toLowerCase().trim();
    const userRoleText = ((userData as any)?.job || (userData as any)?.role || '').toLowerCase().trim();
    const cvName = (userData?.cvName || '').toLowerCase().trim();
    const userLocation = ((userData as any)?.location || (userData as any)?.address || '').toLowerCase().trim();

    // Comprehensive list of generic Vietnamese stop words to prevent accidental keyword collisions (e.g. "viên" in "Nhân viên" vs "Lập trình viên")
    const STOP_WORDS = new Set([
      'nhân', 'viên', 'chuyên', 'cấp', 'ngành', 'bộ', 'phận', 'vị', 'trí', 'người',
      'và', 'hoặc', 'cho', 'của', 'với', 'tại', 'trong', 'theo', 'làm', 'việc', 'tạo',
      'cần', 'tuyển', 'tìm', 'ứng', 'dụng', 'tại', 'ở', 'được', 'các', 'những', 'một',
      'chính', 'thức', 'theo', 'giờ', 'ca', 'nhiệm', 'vụ'
    ]);

    const extractKeywords = (str: string) => {
      return str
        .replace(/[\.\,\-\_\/\(\)]/g, ' ')
        .split(/\s+/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
    };

    const desiredKws = extractKeywords(desired);
    const roleKws = extractKeywords(userRoleText);
    const cvKws = extractKeywords(cvName.replace(/\.pdf|\.docx|\.doc/gi, ''));
    const savedTitles = (savedJobs || []).map((s: any) => (s.jobTitle || s.title || '').toLowerCase());
    const viewedTitles = (viewedJobs || []).map((v: any) => (v.jobTitle || v.title || '').toLowerCase());

    const hasProfileContext =
      desiredKws.length > 0 || roleKws.length > 0 || cvKws.length > 0 || savedTitles.length > 0 || viewedTitles.length > 0;

    const scored = jobListings.map((job) => {
      let domainScore = 0;
      let reason = 'Được TOPPY AI gợi ý phù hợp cho bạn';
      const title = job.title.toLowerCase();
      const industry = (job.originalIndustry || '').toLowerCase();
      const jobLoc = job.location.toLowerCase();

      if (hasProfileContext) {
        // 1. Match Desired Job / Goal (Up to 50 pts)
        if (desiredKws.length > 0) {
          const matchCount = desiredKws.filter((kw) => title.includes(kw) || industry.includes(kw)).length;
          if (matchCount > 0) {
            domainScore += 40 + Math.min(matchCount * 10, 20);
            reason = `Khớp mong muốn "${userData?.desiredJob}"`;
          }
        }

        // 2. Match Current Role / Bio (Up to 30 pts)
        if (roleKws.length > 0) {
          const roleMatch = roleKws.filter((kw) => title.includes(kw) || industry.includes(kw)).length;
          if (roleMatch > 0) {
            domainScore += 30;
            if (!reason.includes('mong muốn')) reason = 'Phù hợp với chuyên môn của bạn';
          }
        }

        // 3. Match CV Profile (Up to 25 pts)
        if (cvKws.length > 0) {
          const cvMatch = cvKws.filter((kw) => title.includes(kw) || industry.includes(kw)).length;
          if (cvMatch > 0) {
            domainScore += 25;
            if (!reason.includes('mong muốn') && !reason.includes('chuyên môn')) reason = 'Khớp chuyên môn trong CV của bạn';
          }
        }

        // 4. Activity context: Saved or Viewed (Up to 20 pts)
        if (savedTitles.some((st) => st.length > 2 && (title.includes(st) || st.includes(title)))) {
          domainScore += 20;
          reason = 'Tương tự các việc làm bạn đã lưu';
        } else if (viewedTitles.some((vt) => vt.length > 2 && (title.includes(vt) || vt.includes(title)))) {
          domainScore += 15;
          if (!reason.includes('lưu')) reason = 'Phù hợp lịch sử xem gần đây';
        }

        // 5. Location Match bonus
        if (userLocation.length > 0 && jobLoc.length > 0) {
          if (userLocation.includes('hồ chí minh') || userLocation.includes('hcm')) {
            if (jobLoc.includes('hồ chí minh') || jobLoc.includes('hcm') || jobLoc.includes('quận') || jobLoc.includes('thủ đức')) domainScore += 10;
          } else if (userLocation.includes('hà nội') || userLocation.includes('hn')) {
            if (jobLoc.includes('hà nội') || jobLoc.includes('cầu giấy')) domainScore += 10;
          }
        }

        if (job.isPremium) domainScore += 5;
      } else {
        // Intelligent fallback for brand new candidates with no profile info
        domainScore = 70;
        reason = job.isPremium ? 'Nhà tuyển dụng Premium hàng đầu' : 'Công việc nổi bật đang được quan tâm';
      }

      // Calculate final match percentage based on domainScore:
      // If there is domainScore > 0 (real domain match), match percentage is high (85% - 98%)
      // If domainScore is 0 (no domain match), assign low percentage (60% - 68%) so non-matching jobs never claim high AI accuracy
      let matchPercentage = 65;
      if (domainScore > 0) {
        matchPercentage = Math.min(Math.max(domainScore, 85), 98);
      } else if (!hasProfileContext) {
        matchPercentage = 80;
      } else {
        reason = 'Công việc đang tuyển gấp khác';
        matchPercentage = 62;
      }

      return {
        ...job,
        score: domainScore,
        matchPercentage,
        reason,
      };
    });

    // Prioritize real domain matching jobs first, then higher match scores
    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [
    jobListings,
    userData?.desiredJob,
    (userData as any)?.job,
    (userData as any)?.role,
    userData?.cvName,
    (userData as any)?.location,
    (userData as any)?.address,
    savedJobs,
    viewedJobs,
  ]);

  const [searchLocationFilter, setSearchLocationFilter] = React.useState('Tất cả');
  const [searchSalaryFilter, setSearchSalaryFilter] = React.useState('Tất cả');
  const [searchTypeFilter, setSearchTypeFilter] = React.useState('Tất cả');
  const [activeCandidateFilterModalType, setActiveCandidateFilterModalType] = React.useState<'location' | 'salary' | 'type' | null>(null);

  const normalizeText = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const getCreatedTime = (dateString: string) => {
    const time = new Date(dateString).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const filteredJobs = React.useMemo(() => {
    return jobListings.filter(job => {
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
      let matchIndustry = checkIndustryMatch(job.originalIndustry, job.title, selectedIndustry);

      // Filter by Salary
      let matchSalary = true;
      if (selectedSalary !== 'Chọn mức lương' && selectedSalary !== 'Tất cả mức lương') {
        matchSalary = checkSalaryMatch(job.price, selectedSalary);
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

      return matchLocation && matchIndustry && matchSalary && matchCategory;
    }).sort((a, b) => {
      const getRank = (item: any) => {
        if (item.isPremium || item.packageTier === 'PREMIUM') return 3;
        if (item.isPro || item.packageTier === 'PRO') return 2;
        return 1;
      };
      const rankA = getRank(a);
      const rankB = getRank(b);
      if (rankA !== rankB) {
        return rankB - rankA;
      }
      return getCreatedTime(b.createdAt) - getCreatedTime(a.createdAt);
    });
  }, [jobListings, selectedLocation, selectedIndustry, selectedSalary, activeChip]);

  const searchSuggestions = React.useMemo(() => {
    const keyword = normalizeText(searchQuery.trim());
    
    const isFilterActive = searchLocationFilter !== 'Tất cả' || 
                           searchSalaryFilter !== 'Tất cả' || 
                           searchTypeFilter !== 'Tất cả';
    
    if (!keyword && !isFilterActive) return [];

    return filteredJobs
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
          
          const regex = /(\d+)\s*(k|tr|triệu|ngàn|nghìn)?/gi;
          let match;
          const numbers: number[] = [];
          const cleanStr = salaryStr.replace(/[,\.]/g, '');
          
          while ((match = regex.exec(cleanStr)) !== null) {
            let val = parseFloat(match[1]);
            const unit = (match[2] || '').toLowerCase();
            if (unit === 'k' || unit === 'ngàn' || unit === 'nghìn') {
              val = val / 1000;
            } else if (unit === 'tr' || unit === 'triệu') {
              val = val;
            } else {
              if (val >= 100000) val = val / 1000000;
              else if (val >= 100) val = val / 1000;
            }
            numbers.push(val);
          }

          if (numbers.length === 1) {
            parsedMax = numbers[0];
            parsedMin = numbers[0];
          } else if (numbers.length >= 2) {
            parsedMin = numbers[0];
            parsedMax = numbers[1];
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
  }, [filteredJobs, searchQuery, searchLocationFilter, searchSalaryFilter, searchTypeFilter]);

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



  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
      {/* Sticky Blue Header fixed at the top */}
      <SafeAreaView style={{ backgroundColor: '#2563EB' }} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
        <View style={styles.heroBlueBanner}>
          {/* Top Bar Header */}
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <Image 
                source={require('../../assets/images/icon.png')} 
                style={{ width: 34, height: 34, borderRadius: 8, marginRight: 10 }} 
                resizeMode="contain" 
              />
              <View>
                <Text style={styles.brandTitle}>BybitJobs</Text>
                <Text style={styles.brandSubtitle}>Tìm việc làm nhanh chóng</Text>
              </View>
            </View>

            <View style={styles.headerRightGroup}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsSearchModalVisible(true)}
                style={styles.iconButton}
              >
                <Ionicons name="search" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Selectors / Dropdowns Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorsScrollContainer}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsIndustryModalVisible(true)}
              style={[
                styles.selectorDropdownPill,
                selectedIndustry !== 'Chọn lĩnh vực' && selectedIndustry !== 'Tất cả lĩnh vực' && styles.selectorDropdownPillActive
              ]}
            >
              <Ionicons
                name="briefcase-outline"
                size={15}
                color={selectedIndustry !== 'Chọn lĩnh vực' && selectedIndustry !== 'Tất cả lĩnh vực' ? '#2563EB' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.selectorTextPill,
                  selectedIndustry !== 'Chọn lĩnh vực' && selectedIndustry !== 'Tất cả lĩnh vực' && styles.selectorTextPillActive
                ]}
              >
                {selectedIndustry}
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={selectedIndustry !== 'Chọn lĩnh vực' && selectedIndustry !== 'Tất cả lĩnh vực' ? '#2563EB' : '#FFFFFF'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsLocationModalVisible(true)}
              style={[
                styles.selectorDropdownPill,
                selectedLocation !== 'Chọn địa điểm' && selectedLocation !== 'Tất cả địa điểm' && styles.selectorDropdownPillActive
              ]}
            >
              <Ionicons
                name="location-outline"
                size={15}
                color={selectedLocation !== 'Chọn địa điểm' && selectedLocation !== 'Tất cả địa điểm' ? '#2563EB' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.selectorTextPill,
                  selectedLocation !== 'Chọn địa điểm' && selectedLocation !== 'Tất cả địa điểm' && styles.selectorTextPillActive
                ]}
              >
                {selectedLocation}
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={selectedLocation !== 'Chọn địa điểm' && selectedLocation !== 'Tất cả địa điểm' ? '#2563EB' : '#FFFFFF'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsSalaryModalVisible(true)}
              style={[
                styles.selectorDropdownPill,
                selectedSalary !== 'Chọn mức lương' && selectedSalary !== 'Tất cả mức lương' && styles.selectorDropdownPillActive
              ]}
            >
              <Ionicons
                name="cash-outline"
                size={15}
                color={selectedSalary !== 'Chọn mức lương' && selectedSalary !== 'Tất cả mức lương' ? '#2563EB' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.selectorTextPill,
                  selectedSalary !== 'Chọn mức lương' && selectedSalary !== 'Tất cả mức lương' && styles.selectorTextPillActive
                ]}
              >
                {selectedSalary}
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={selectedSalary !== 'Chọn mức lương' && selectedSalary !== 'Tất cả mức lương' ? '#2563EB' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Main Body ScrollView */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >

          {/* AI Advisor Banner */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/ai-advisor')}
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 4,
              borderRadius: 16,
              padding: 14,
              backgroundColor: isDark ? '#1F1A24' : '#F5F3FF',
              borderColor: isDark ? '#3B2D54' : '#DDD6FE',
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={20} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFF' : '#11181C' }}>
                  Trợ lý AI BybitJobs
                </Text>
                <Text style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 1 }}>
                  {userRole === 'employer' ? 'Tư vấn câu hỏi phỏng vấn & dải lương thị trường' : 'Tập phỏng vấn thử (Mock Interview) & Cố vấn CV'}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: '#7C3AED', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Hỏi AI ✨</Text>
            </View>
          </TouchableOpacity>

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

          {/* TOPPY AI Job Recommendations */}
          <View style={styles.aiRecommendedSection}>
            <View style={styles.aiSectionHeader}>
              <Ionicons name="sparkles" size={18} color="#0F172A" />
              <Text style={[styles.aiSectionTitle, { color: '#0F172A' }]}>
                Việc làm đề xuất từ TOPPY AI
              </Text>
              {userData?.uid && aiRecommendedJobs.length > 0 && (
                <View style={styles.aiHeaderBadge}>
                  <Text style={styles.aiHeaderBadgeText}>Phù hợp với bạn</Text>
                </View>
              )}
            </View>

            {!userData?.uid ? (
              <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="sparkles" size={26} color="#7C3AED" />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A', textAlign: 'center' }}>
                  Đăng nhập để xem Đề xuất Việc làm từ TOPPY AI ✨
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 10 }}>
                  TOPPY AI tự động phân tích kinh nghiệm & vị trí mong muốn của bạn để tìm việc làm phù hợp nhất (&gt;85%).
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push('/login')}
                  style={{ backgroundColor: '#0084FF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 14 }}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>🔑 Đăng nhập / Đăng ký ngay</Text>
                </TouchableOpacity>
              </View>
            ) : aiRecommendedJobs.length > 0 ? (
              <>
                <Text style={[styles.aiSectionDesc, { color: '#64748B' }]}>
                  Hệ thống AI phân tích thực tế từ CV, vị trí mong muốn & lịch sử quan tâm của bạn.
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
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E2E8F0',
                        },
                      ]}
                    >
                      <View style={styles.aiCardTop}>
                        {/* Avatar */}
                        <View style={[styles.aiJobAvatar, { backgroundColor: '#F1F5F9' }]}>
                          <Text style={styles.aiJobAvatarText}>{job.author.avatar}</Text>
                        </View>
                        
                        {/* Job details */}
                        <View style={styles.aiJobTextWrapper}>
                          <Text style={[styles.aiJobTitle, { color: '#0F172A' }]} numberOfLines={1} ellipsizeMode="tail">
                            {job.title}
                          </Text>
                          <Text style={styles.aiCompanyName} numberOfLines={1} ellipsizeMode="tail">
                            {job.author.name}
                          </Text>
                        </View>
                      </View>

                      {/* Fit percentage indicator */}
                      <View style={styles.fitProgressContainer}>
                        <View style={styles.fitProgressHeader}>
                          <Text style={styles.fitReasonText} numberOfLines={1} ellipsizeMode="tail">🎯 {job.reason}</Text>
                          <Text style={styles.fitPercentageText}>Độ khớp {job.matchPercentage}%</Text>
                        </View>
                        <View style={[styles.fitProgressBarBg, { backgroundColor: '#F1F5F9' }]}>
                          <View
                            style={[
                              styles.fitProgressBarFill,
                              {
                                width: `${job.matchPercentage}%`,
                                backgroundColor: job.matchPercentage >= 75 ? '#10B981' : '#0F172A',
                              },
                            ]}
                          />
                        </View>
                      </View>

                      {/* Metadata (Salary, Location) */}
                      <View style={styles.aiCardMeta}>
                        <Text style={[styles.aiMetaText, { color: '#64748B' }]} numberOfLines={1} ellipsizeMode="tail">
                          💰 {job.price}
                        </Text>
                        <Text style={[styles.aiMetaText, { color: '#64748B' }]} numberOfLines={1} ellipsizeMode="tail">
                          📍 {job.location}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <View style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                marginTop: 8,
              }}>
                <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20, fontWeight: '500' }}>
                  🤖 {userData?.uid ? 'Tài khoản của bạn chưa có thông tin công việc mong muốn hoặc CV. Hãy cập nhật hồ sơ để TOPPY AI tính toán độ khớp (%) thực tế và gợi ý việc làm chính xác cho bạn!' : 'Vui lòng đăng nhập và cập nhật hồ sơ để TOPPY AI gợi ý việc làm chính xác cho bạn!'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push(userData?.uid ? '/profile' : '/login')}
                  style={{
                    backgroundColor: '#0F172A',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    marginTop: 12,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                    {userData?.uid ? '🎯 Cập nhật công việc mong muốn & CV' : 'Đăng nhập ngay'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Featured Companies Section (Thương hiệu nổi bật) */}
          {featuredPremiumCompanies.length > 0 && (
            <View style={styles.featuredCompaniesSection}>
              {/* Ultra High-End Premium Section Header */}
              <View style={styles.sectionHeaderRow}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FEF3C7',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 6,
                }}>
                  <Ionicons name="sparkles" size={18} color="#D97706" />
                </View>
                <Text style={[styles.sectionTitleText, { color: isDark ? '#FFF' : '#11181C', fontSize: 18, fontWeight: '800' }]}>
                  CÔNG TY HÀNG ĐẦU
                </Text>
                <View style={{
                  backgroundColor: '#F59E0B',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 3,
                  shadowColor: '#F59E0B',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.4,
                  shadowRadius: 4,
                  elevation: 4,
                  marginLeft: 8,
                }}>
                  <Ionicons name="star" size={10} color="#FFF" />
                  <Text style={{ color: '#FFF', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.4 }}>PREMIUM VIP</Text>
                </View>
              </View>
              <Text style={[styles.sectionDescText, { color: isDark ? '#9BA1A6' : '#64748B', fontSize: 13, marginTop: 4, marginBottom: 14 }]}>
                Doanh nghiệp VIP hàng đầu được bảo chứng uy tín và ưu tiên hiển thị bởi BybitJobs
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.companiesScrollList}
              >
                {featuredPremiumCompanies.map((company) => {
                  const matchingJobsCount = jobListings.filter((job) => {
                    const originalJob = openJobs.find((item) => item.id === job.id);
                    return originalJob?.employerId === company.employerId;
                  }).length;

                  return (
                    <TouchableOpacity
                      key={company.id}
                      activeOpacity={0.9}
                      onPress={() => {
                        setSelectedCompany(company);
                        setCompanyModalTab('overview');
                        setIsCompanyModalVisible(true);
                      }}
                      style={[
                        styles.companyCard,
                        {
                          backgroundColor: isDark ? '#1C1917' : '#FFFFFF',
                          borderColor: '#F59E0B',
                          borderWidth: 2,
                          shadowColor: '#F59E0B',
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.25,
                          shadowRadius: 10,
                          elevation: 6,
                          width: 280,
                          borderRadius: 20,
                          overflow: 'hidden',
                          marginRight: 14,
                        },
                      ]}
                    >
                      {/* Cover Photo */}
                      <View style={{ position: 'relative' }}>
                        <Image source={{ uri: company.coverImage }} style={{ width: '100%', height: 95 }} resizeMode="cover" />
                        
                        {/* Crown VIP Badge Floating */}
                        <View style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          backgroundColor: 'rgba(0, 0, 0, 0.75)',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          borderWidth: 1,
                          borderColor: '#F59E0B',
                        }}>
                          <Text style={{ fontSize: 11 }}>👑</Text>
                          <Text style={{ color: '#F59E0B', fontSize: 9.5, fontWeight: '900', letterSpacing: 0.3 }}>TOP 1 VIP</Text>
                        </View>
                      </View>

                      {/* Content Section */}
                      <View style={{ padding: 14, paddingTop: 32, position: 'relative' }}>
                        {/* Glowing Logo Avatar */}
                        <View style={{
                          position: 'absolute',
                          top: -26,
                          left: 14,
                          width: 52,
                          height: 52,
                          borderRadius: 16,
                          borderWidth: 2.5,
                          borderColor: '#F59E0B',
                          backgroundColor: '#FFF',
                          overflow: 'hidden',
                          elevation: 4,
                          shadowColor: '#F59E0B',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                        }}>
                          <Image source={{ uri: company.logo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        </View>

                        {/* Title & Verification */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#FFF' : '#11181C', flex: 1 }}>
                            {company.name}
                          </Text>
                          <Ionicons name="checkmark-circle" size={16} color="#0084FF" />
                        </View>

                        <Text style={{ fontSize: 12, color: '#F59E0B', fontWeight: '700', marginBottom: 6 }}>
                          ⭐ {company.rating} • {company.scale || '100-500 nhân viên'}
                        </Text>
                        
                        <Text numberOfLines={1} style={{ fontSize: 12, color: isDark ? '#9BA1A6' : '#64748B', marginBottom: 12 }}>
                          📍 {company.location.split(',').slice(-2).join(',').trim()}
                        </Text>

                        {/* Bottom Tag */}
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: isDark ? '#2C2A24' : '#FEF3C7',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: isDark ? '#453517' : '#FDE68A',
                        }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#F59E0B' : '#B45309' }}>
                            🔥 {matchingJobsCount || 3} vị trí tuyển dụng hot
                          </Text>
                          <Ionicons name="arrow-forward-circle" size={18} color="#D97706" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

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
                  Chưa có công việc phù hợp tại tiêu chí địa điểm/lĩnh vực/mức lương này
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedLocation('Tất cả địa điểm');
                    setSelectedIndustry('Tất cả lĩnh vực');
                    setSelectedSalary('Tất cả mức lương');
                  }}
                  style={styles.resetFilterBtn}
                >
                  <Text style={styles.resetFilterBtnText}>Xem tất cả công việc</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredJobs.map((job) => {
                const isBookmarked = bookmarkedJobs.includes(job.id);
                const isEmployerPremium = (job as any).employerId ? premiumEmployersById[(job as any).employerId] === true : false;
                const isEmployerPro = (job as any).employerId ? proEmployersById[(job as any).employerId] === true : false;
                const rawPkg = String((job as any).packageTier || (job as any).package || (job as any).packageName || (job as any).packageId || '').toUpperCase();

                const isPremiumJob = job.isPremium === true || (job as any).isVip === true || rawPkg.includes('PREMIUM') || rawPkg.includes('VIP') || isEmployerPremium;
                const isProJob = !isPremiumJob && ((job as any).isPro === true || rawPkg.includes('PRO') || isEmployerPro);
                return (
                  <TouchableOpacity
                    key={job.id}
                    activeOpacity={0.9}
                    onPress={() => openJobDetails(job)}
                    style={[
                      styles.jobCard,
                      isDark ? styles.jobCardDark : styles.jobCardLight,
                      isPremiumJob && {
                        borderColor: '#F59E0B',
                        borderWidth: 2,
                        backgroundColor: isDark ? '#1C1917' : '#FEFDF5',
                        elevation: 6,
                        shadowColor: '#F59E0B',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                      },
                      isProJob && {
                        borderColor: '#2563EB',
                        borderWidth: 1.5,
                        backgroundColor: isDark ? '#171E2E' : '#F0F7FF',
                        elevation: 4,
                        shadowColor: '#2563EB',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                      }
                    ]}
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
                        {isPremiumJob ? (
                          <View style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            backgroundColor: '#F59E0B',
                            borderRadius: 10,
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderWidth: 1.5,
                            borderColor: '#FFFFFF',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 2,
                            elevation: 4,
                            shadowColor: '#F59E0B',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.4,
                            shadowRadius: 4,
                          }}>
                            <Ionicons name="star" size={9} color="#FFF" />
                            <Text style={{ color: '#FFF', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.3 }}>PREMIUM</Text>
                          </View>
                        ) : isProJob ? (
                          <View style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            backgroundColor: '#2563EB',
                            borderRadius: 10,
                            paddingHorizontal: 6,
                            paddingVertical: 1.5,
                            borderWidth: 1.5,
                            borderColor: '#FFFFFF',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 2,
                            elevation: 4,
                            shadowColor: '#2563EB',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.4,
                            shadowRadius: 4,
                          }}>
                            <Ionicons name="flash" size={9} color="#FFF" />
                            <Text style={{ color: '#FFF', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.3 }}>PRO</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Job Main Details */}
                      <View style={styles.jobDetails}>
                        {isPremiumJob ? (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            backgroundColor: '#FEF3C7',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 8,
                            alignSelf: 'flex-start',
                            marginBottom: 4,
                            borderWidth: 1,
                            borderColor: '#FDE68A',
                          }}>
                            <Ionicons name="sparkles" size={11} color="#D97706" />
                            <Text style={{ color: '#B45309', fontSize: 10, fontWeight: '800' }}>TIN ƯU TIÊN PREMIUM</Text>
                          </View>
                        ) : isProJob ? (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            backgroundColor: '#DBEAFE',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 8,
                            alignSelf: 'flex-start',
                            marginBottom: 4,
                            borderWidth: 1,
                            borderColor: '#BFDBFE',
                          }}>
                            <Ionicons name="flash" size={11} color="#1D4ED8" />
                            <Text style={{ color: '#1E40AF', fontSize: 10, fontWeight: '800' }}>TIN ƯU TIÊN PRO</Text>
                          </View>
                        ) : null}
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
                          <CompanyLogoAvatar
                            logoUri={(job as any).companyLogo || (job as any).logo || (job as any).authorLogo || (job.author.name === employerData?.companyName ? (employerData?.logo || (employerData as any)?.logoUrl || userDataExtra?.avatar) : null)}
                            fallbackText={job.author.avatar || 'TC'}
                            isDark={isDark}
                          />
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

      {/* Company Details Modal */}
      <Modal
        visible={isCompanyModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsCompanyModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: isDark ? '#151718' : '#F4F5F7' }}>
          {selectedCompany && (
            <View style={styles.companyModalRoot}>
              {/* Cover Image & Back Button */}
              <View style={[styles.companyModalHero, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
                <Image source={{ uri: selectedCompany.coverImage }} style={styles.companyModalCover} resizeMode="cover" />
                <View style={styles.companyModalCoverOverlay} />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsCompanyModalVisible(false)}
                  style={styles.companyModalBackBtn}
                >
                  <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={styles.companyModalPremiumPill}>
                  <Ionicons name="sparkles" size={13} color="#FFF" />
                  <Text style={styles.companyModalPremiumText}>Premium</Text>
                </View>
              </View>

              {/* Logo overlap & Company Header */}
              <View style={[styles.companyModalHeaderCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
                <View style={styles.companyModalIdentityRow}>
                  <Image
                    source={{ uri: selectedCompany.logo }}
                    style={[styles.companyModalLogo, { borderColor: isDark ? '#1C1C1E' : '#FFF' }]}
                  />
                  <View style={styles.companyModalTitleWrap}>
                    <View style={styles.companyModalNameRow}>
                      <Text style={[styles.companyModalName, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={2}>
                        {selectedCompany.name}
                      </Text>
                      <Ionicons name="checkmark-circle" size={16} color="#0084FF" />
                    </View>
                    <Text style={styles.companyModalIndustry} numberOfLines={2}>{selectedCompany.industry}</Text>
                  </View>
                </View>

                {/* Quick Meta */}
                <View style={styles.companyModalMetaGrid}>
                  <View style={[styles.companyModalMetaCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
                    <Ionicons name="people-outline" size={17} color="#0084FF" />
                    <Text style={styles.companyModalMetaLabel}>Quy mô</Text>
                    <Text style={[styles.companyModalMetaValue, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>{selectedCompany.scale}</Text>
                  </View>
                  <View style={[styles.companyModalMetaCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
                    <Ionicons name="location-outline" size={17} color="#0084FF" />
                    <Text style={styles.companyModalMetaLabel}>Địa điểm</Text>
                    <Text style={[styles.companyModalMetaValue, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={1}>
                      {selectedCompany.location.split(',').slice(-2).join(',').trim()}
                    </Text>
                  </View>
                  <View style={[styles.companyModalMetaCard, { backgroundColor: isDark ? '#151718' : '#F8FAFC' }]}>
                    <Ionicons name="star" size={17} color="#FFB300" />
                    <Text style={styles.companyModalMetaLabel}>Đánh giá</Text>
                    <Text style={[styles.companyModalMetaValue, { color: isDark ? '#FFF' : '#11181C' }]}>{selectedCompany.rating}</Text>
                  </View>
                </View>
              </View>

              {/* Custom Segmented Tabs */}
              {(() => {
                const matchingJobs = jobListings.filter(job => {
                  const originalJob = openJobs.find((item) => item.id === job.id);
                  if (selectedCompany.employerId && originalJob?.employerId) {
                    return originalJob.employerId === selectedCompany.employerId;
                  }
                  const author = job.author.name.toLowerCase();
                  const comp = selectedCompany.name.toLowerCase();
                  return author.includes(comp) || comp.includes(author);
                });

                return (
                  <View style={styles.companyModalBody}>
                    <View style={[styles.companyModalTabs, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setCompanyModalTab('overview')}
                        style={[styles.companyModalTab, companyModalTab === 'overview' && styles.companyModalTabActive]}
                      >
                        <Text style={[styles.companyModalTabText, { color: companyModalTab === 'overview' ? '#0084FF' : (isDark ? '#9BA1A6' : '#687076') }]}>
                          Tổng quan
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setCompanyModalTab('jobs')}
                        style={[styles.companyModalTab, companyModalTab === 'jobs' && styles.companyModalTabActive]}
                      >
                        <Text style={[styles.companyModalTabText, { color: companyModalTab === 'jobs' ? '#0084FF' : (isDark ? '#9BA1A6' : '#687076') }]} numberOfLines={1}>
                          Việc đang tuyển ({matchingJobs.length})
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.companyModalScrollContent} showsVerticalScrollIndicator={false}>
                      {companyModalTab === 'overview' ? (
                        <View style={styles.companyModalSectionList}>
                          {/* Description */}
                          <View style={[styles.companyInfoPanel, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
                            <View style={styles.companyPanelTitleRow}>
                              <View style={[styles.companyPanelIcon, { backgroundColor: isDark ? '#0B2C4D' : '#E6F4FE' }]}>
                                <Ionicons name="business-outline" size={18} color="#0084FF" />
                              </View>
                              <Text style={[styles.companyPanelTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                              Về doanh nghiệp
                              </Text>
                            </View>
                            <Text style={[styles.companyPanelBodyText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                              {selectedCompany.description}
                            </Text>
                          </View>

                          {/* Address details */}
                          <View style={[styles.companyInfoPanel, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
                            <View style={styles.companyPanelTitleRow}>
                              <View style={[styles.companyPanelIcon, { backgroundColor: isDark ? '#0B2C4D' : '#E6F4FE' }]}>
                                <Ionicons name="location-outline" size={18} color="#0084FF" />
                              </View>
                              <Text style={[styles.companyPanelTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                                Địa chỉ trụ sở
                              </Text>
                            </View>
                            <Text style={[styles.companyPanelBodyText, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                              {selectedCompany.location}
                            </Text>
                          </View>

                          {/* Benefits list */}
                          <View style={[styles.companyInfoPanel, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
                            <View style={styles.companyPanelTitleRow}>
                              <View style={[styles.companyPanelIcon, { backgroundColor: isDark ? '#0B2C4D' : '#E6F4FE' }]}>
                                <Ionicons name="gift-outline" size={18} color="#0084FF" />
                              </View>
                              <Text style={[styles.companyPanelTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                                Quyền lợi & đãi ngộ
                              </Text>
                            </View>
                            {selectedCompany.benefits.map((benefit, index) => (
                              <View key={index} style={styles.companyBenefitRow}>
                                <Ionicons name="checkmark-circle" size={17} color="#0084FF" style={{ marginTop: 1 }} />
                                <Text style={[styles.companyBenefitText, { color: isDark ? '#ECEDEE' : '#333' }]}>
                                  {benefit}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : (
                        <View style={{ gap: 12 }}>
                          {matchingJobs.length === 0 ? (
                            <View style={styles.companyEmptyJobs}>
                              <Ionicons name="briefcase-outline" size={44} color="#8E8E93" />
                              <Text style={styles.companyEmptyJobsText}>
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
                                style={[styles.companyJobCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}
                              >
                                <View style={styles.companyJobCardTop}>
                                  <Text style={[styles.companyJobTitle, { color: isDark ? '#FFF' : '#11181C' }]} numberOfLines={2}>
                                    {job.title}
                                  </Text>
                                  <Text style={styles.companyJobPrice} numberOfLines={1}>
                                    {job.price}
                                  </Text>
                                </View>
                                <View style={styles.companyJobMetaRow}>
                                  <Ionicons name="location-outline" size={13} color="#8E8E93" />
                                  <Text style={styles.companyJobMetaText} numberOfLines={1}>{job.location}</Text>
                                </View>
                                <View style={styles.companyJobMetaRow}>
                                  <Ionicons name="time-outline" size={13} color="#8E8E93" />
                                  <Text style={styles.companyJobMetaText} numberOfLines={1}>{job.timeLeft.split(':')[1]?.trim() || job.timeLeft}</Text>
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
        </View>
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
                onPress={() => setActiveCandidateFilterModalType('location')}
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
                onPress={() => setActiveCandidateFilterModalType('salary')}
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
                onPress={() => setActiveCandidateFilterModalType('type')}
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
                      isSelected && { backgroundColor: isDark ? '#26354A' : '#F1F5F9' }
                    ]}
                  >
                    <Text style={[
                      styles.modalItemText,
                      { color: isDark ? '#FFF' : '#333' },
                      isSelected && { color: '#0F172A', fontWeight: 'bold' }
                    ]}>
                      {ind}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#0F172A" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Salary Selection Modal */}
      <Modal
        visible={isSalaryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSalaryModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsSalaryModalVisible(false)}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1' }]}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Chọn mức lương mong muốn
              </Text>
              <TouchableOpacity
                onPress={() => setIsSalaryModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#333'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {salaryRanges.map((sal) => {
                const isSelected = selectedSalary === sal || (sal === 'Tất cả mức lương' && selectedSalary === 'Chọn mức lương');
                return (
                  <TouchableOpacity
                    key={sal}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedSalary(sal);
                      setIsSalaryModalVisible(false);
                    }}
                    style={[
                      styles.modalItem,
                      { borderBottomColor: isDark ? '#2C2C2E' : '#ECEFF1' },
                      isSelected && { backgroundColor: isDark ? '#26354A' : '#F1F5F9' }
                    ]}
                  >
                    <Text style={[
                      styles.modalItemText,
                      { color: isDark ? '#FFF' : '#333' },
                      isSelected && { color: '#0F172A', fontWeight: 'bold' }
                    ]}>
                      {sal}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#0F172A" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Dạng Danh Sách Bộ Lọc Tìm Kiếm Cho Ứng Viên (Candidate Search Filter List Modal) */}
      <Modal
        visible={activeCandidateFilterModalType !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveCandidateFilterModalType(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActiveCandidateFilterModalType(null)}
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
                <Ionicons name="options-outline" size={20} color="#0084FF" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFF' : '#0F172A' }}>
                  {activeCandidateFilterModalType === 'location' && 'Danh sách Lọc Địa điểm Thành phố'}
                  {activeCandidateFilterModalType === 'salary' && 'Danh sách Lọc Khoảng Mức lương'}
                  {activeCandidateFilterModalType === 'type' && 'Danh sách Lọc Hình thức Làm việc'}
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveCandidateFilterModalType(null)}>
                <Ionicons name="close" size={22} color={isDark ? '#FFF' : '#64748B'} />
              </TouchableOpacity>
            </View>

            {/* List Selection Items */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {activeCandidateFilterModalType === 'location' && [
                { id: 'Tất cả', label: 'Tất cả địa điểm', sub: 'Hiển thị bài đăng tuyển dụng trên toàn quốc', icon: 'globe-outline' },
                { id: 'Hồ Chí Minh', label: 'TP. Hồ Chí Minh', sub: 'Tuyển dụng khu vực HCM, Thủ Đức, Tân Bình...', icon: 'location-outline' },
                { id: 'Hà Nội', label: 'Hà Nội', sub: 'Tuyển dụng khu vực Cầu Giấy, Hoàn Kiếm, Từ Liêm...', icon: 'location-outline' },
                { id: 'Đà Nẵng', label: 'Đà Nẵng & Miền Trung', sub: 'Tuyển dụng khu vực Đà Nẵng, Huế, Quảng Nam...', icon: 'location-outline' },
                { id: 'Cần Thơ', label: 'Cần Thơ & Miền Tây', sub: 'Khu vực Cần Thơ, Long An, Tiền Giang...', icon: 'location-outline' },
                { id: 'Bình Dương', label: 'Bình Dương & Đồng Nai', sub: 'Khu vực Đông Nam Bộ, khu công nghiệp...', icon: 'business-outline' },
              ].map((item) => {
                const isSelected = searchLocationFilter === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSearchLocationFilter(item.id);
                      setActiveCandidateFilterModalType(null);
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

              {activeCandidateFilterModalType === 'salary' && [
                { id: 'Tất cả', label: 'Tất cả mức lương', sub: 'Xem tin tuyển dụng của mọi mức ngân sách', icon: 'cash-outline' },
                { id: 'Dưới 10 triệu', label: 'Dưới 10 triệu VNĐ', sub: 'Phù hợp cho vị trí Thực tập sinh, Part-time, Fresher', icon: 'wallet-outline' },
                { id: '10 - 20 triệu', label: '10 - 20 triệu VNĐ', sub: 'Mức lương phổ biến cho nhân sự 1-3 năm kinh nghiệm', icon: 'wallet-outline' },
                { id: 'Trên 20 triệu', label: 'Trên 20 triệu VNĐ / Thỏa thuận', sub: 'Thu nhập hấp dẫn cho Senior, Manager & Chuyên gia', icon: 'trophy-outline' },
              ].map((item) => {
                const isSelected = searchSalaryFilter === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSearchSalaryFilter(item.id);
                      setSelectedSalary(item.id === 'Tất cả' ? 'Tất cả mức lương' : item.id);
                      setActiveCandidateFilterModalType(null);
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

              {activeCandidateFilterModalType === 'type' && [
                { id: 'Tất cả', label: 'Tất cả hình thức', sub: 'Không giới hạn thời gian làm việc', icon: 'briefcase-outline' },
                { id: 'Toàn thời gian', label: 'Toàn thời gian (Full-time)', sub: 'Làm việc chính thức 8 tiếng/ngày', icon: 'time-outline' },
                { id: 'Bán thời gian', label: 'Bán thời gian (Part-time / Ca)', sub: 'Làm theo ca, linh hoạt thời gian cho sinh viên', icon: 'calendar-outline' },
                { id: 'Thực tập', label: 'Thực tập sinh (Internship)', sub: 'Vị trí thực tập học hỏi tích lũy kinh nghiệm', icon: 'school-outline' },
              ].map((item) => {
                const isSelected = searchTypeFilter === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSearchTypeFilter(item.id);
                      setActiveCandidateFilterModalType(null);
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

            {/* Clear button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (activeCandidateFilterModalType === 'location') setSearchLocationFilter('Tất cả');
                if (activeCandidateFilterModalType === 'salary') setSearchSalaryFilter('Tất cả');
                if (activeCandidateFilterModalType === 'type') setSearchTypeFilter('Tất cả');
                setActiveCandidateFilterModalType(null);
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heroBlueBanner: {
    backgroundColor: '#2563EB',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 12,
    marginBottom: 4,
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    height: 58,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E0F2FE',
    marginTop: 1,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
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
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  selectorsScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorDropdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 20,
    height: 38,
    paddingHorizontal: 14,
    gap: 6,
  },
  selectorDropdownPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  selectorTextPill: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  selectorTextPillActive: {
    color: '#2563EB',
    fontWeight: '700',
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
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
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
    color: '#0F172A',
    fontSize: 22,
    fontWeight: 'bold',
  },
  hotBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipItemInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  chipItemDark: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipTextInactive: {
    color: '#64748B',
  },
  chipTextDark: {
    color: '#64748B',
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
  companyModalRoot: {
    flex: 1,
  },
  companyModalHero: {
    height: 238,
    position: 'relative',
  },
  companyModalCover: {
    width: '100%',
    height: '100%',
  },
  companyModalCoverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 132, 255, 0.28)',
  },
  companyModalBackBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 64 : 36,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyModalPremiumPill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 66 : 38,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 132, 255, 0.92)',
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
  },
  companyModalPremiumText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  companyModalHeaderCard: {
    marginHorizontal: 16,
    marginTop: -42,
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  companyModalIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyModalLogo: {
    width: 74,
    height: 74,
    borderRadius: 18,
    borderWidth: 3,
    backgroundColor: '#FFF',
  },
  companyModalTitleWrap: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  companyModalNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  companyModalName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  companyModalIndustry: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 3,
  },
  companyModalMetaGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  companyModalMetaCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  companyModalMetaLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },
  companyModalMetaValue: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
  },
  companyModalBody: {
    flex: 1,
    paddingTop: 12,
  },
  companyModalTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    padding: 4,
  },
  companyModalTab: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  companyModalTabActive: {
    backgroundColor: '#E6F4FE',
  },
  companyModalTabText: {
    fontSize: 13,
    fontWeight: '900',
  },
  companyModalScrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  companyModalSectionList: {
    gap: 12,
  },
  companyInfoPanel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  companyPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  companyPanelIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  companyPanelTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
  },
  companyPanelBodyText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  companyBenefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingVertical: 6,
  },
  companyBenefitText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  companyEmptyJobs: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  companyEmptyJobsText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
  },
  companyJobCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  companyJobCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  companyJobTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  companyJobPrice: {
    maxWidth: 112,
    color: '#0084FF',
    fontSize: 12,
    fontWeight: '900',
  },
  companyJobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  companyJobMetaText: {
    flex: 1,
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
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
