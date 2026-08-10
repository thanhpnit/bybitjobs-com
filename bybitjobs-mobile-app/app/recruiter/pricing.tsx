import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { useAuth, getEmployerPackageTier } from '../../hooks/use-auth';

interface PackageItem {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  duration: string;
  tag: string;
  subTag?: string;
  features: string[];
  isPopular?: boolean;
  isVip?: boolean;
}

export default function RecruiterPricingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { employerData } = useAuth();

  const activePkgInfo = React.useMemo(() => {
    return getEmployerPackageTier(employerData);
  }, [employerData]);

  const defaultPackages: PackageItem[] = [
    {
      id: 'free',
      name: 'Gói MIỄN PHÍ',
      price: '0 VNĐ',
      priceNum: 0,
      duration: 'Vĩnh viễn',
      tag: 'CƠ BẢN STARTER',
      subTag: 'MIỄN PHÍ',
      features: [
        'Đăng tối đa: 5 tin tuyển dụng',
        'Mở khóa: 10 CV ứng viên',
        'Hiển thị bài đăng tiêu chuẩn',
        'Quản lý hồ sơ ứng viên tự động',
        'Hỗ trợ tuyển dụng 24/7',
      ],
      isPopular: false,
      isVip: false,
    },
    {
      id: 'pro',
      name: 'Gói PRO (Phổ Biến ⭐)',
      price: '299,000đ',
      priceNum: 299000,
      duration: '30 ngày',
      tag: 'BÁN CHẠY NHẤT ⭐',
      subTag: 'TIẾT KIỆM 40%',
      features: [
        'Đăng tối đa: 15 tin tuyển dụng',
        'Mở khóa: 50 CV ứng viên',
        '⚡ Ghim ƯU TIÊN TOP 2 Trang Chủ',
        '⚡ Huy hiệu ⚡ PRO Xanh Royal phát sáng',
        '⚡ Đánh giá AI độ phù hợp CV ứng viên',
      ],
      isPopular: true,
      isVip: false,
    },
    {
      id: 'premium',
      name: 'Gói PREMIUM (VIP 👑)',
      price: '799,000đ',
      priceNum: 799000,
      duration: '30 ngày',
      tag: 'ĐỘC QUYỀN TOP 1 👑',
      subTag: 'TIẾT KIỆM 47%',
      features: [
        '🔥 KHÔNG GIỚI HẠN số lượng tin tuyển dụng',
        '🔥 KHÔNG GIỚI HẠN xem & mở khóa CV ứng viên',
        '👑 Ghim ĐỘC QUYỀN TOP 1 Trang Chủ',
        '👑 Huy hiệu ★ PREMIUM Vàng Amber Hoàng Gia',
        '👑 Trợ lý AI HR Soạn JD & Phỏng vấn',
        '👑 Hiển thị Logo nổi bật mục Công ty Hàng đầu',
      ],
      isPopular: false,
      isVip: true,
    },
  ];

  const [packages, setPackages] = React.useState<PackageItem[]>(defaultPackages);

  React.useEffect(() => {
    // 1. Real-time Listener tới Firestore collection 'packages'
    const unsub = onSnapshot(
      collection(db, 'packages'),
      (snapshot) => {
        const dataFromDb: any[] = [];
        snapshot.forEach((docSnap) => {
          dataFromDb.push({ id: docSnap.id, ...docSnap.data() });
        });

        if (dataFromDb.length > 0) {
          const mapByTier: Record<string, PackageItem> = {};

          dataFromDb.forEach((pkg: any) => {
            const isVip = pkg.id === 'premium' || pkg.name?.toLowerCase().includes('premium') || pkg.name?.toLowerCase().includes('vip');
            const isPopular = pkg.id === 'pro' || pkg.isPopular || pkg.name?.toLowerCase().includes('pro');
            const isFree = pkg.id === 'free' || pkg.priceNum === 0 || pkg.name?.toLowerCase().includes('miễn phí') || pkg.name?.toLowerCase().includes('starter');

            let key = 'free';
            if (isVip) key = 'premium';
            else if (isPopular) key = 'pro';

            let displayPrice = pkg.price;
            let priceNum = pkg.priceNum;

            if (isFree) {
              displayPrice = '0 VNĐ';
              priceNum = 0;
            } else if (isPopular) {
              displayPrice = '299,000đ';
              priceNum = 299000;
            } else if (isVip) {
              displayPrice = '799,000đ';
              priceNum = 799000;
            }

            let postsText = pkg.posts || (isFree ? '5 tin tuyển dụng' : isPopular ? '15 tin tuyển dụng' : 'KHÔNG GIỚI HẠN tin đăng');
            let cvsText = pkg.cvs || (isFree ? '10 CV ứng viên' : isPopular ? '50 CV ứng viên' : 'KHÔNG GIỚI HẠN mở khóa CV');

            mapByTier[key] = {
              id: key,
              name: isVip ? 'Gói PREMIUM (VIP 👑)' : isPopular ? 'Gói PRO (Phổ Biến ⭐)' : 'Gói MIỄN PHÍ',
              price: displayPrice,
              priceNum: priceNum,
              duration: isFree ? 'Vĩnh viễn' : '30 ngày',
              tag: isVip ? 'ĐỘC QUYỀN TOP 1 👑' : isPopular ? 'BÁN CHẠY NHẤT ⭐' : 'CƠ BẢN STARTER',
              subTag: isVip ? 'TIẾT KIỆM 47%' : isPopular ? 'TIẾT KIỆM 40%' : 'MIỄN PHÍ',
              features: [
                `Đăng tối đa: ${postsText}`,
                `Lượt xem & Mở khóa: ${cvsText}`,
                isVip ? '👑 Ghim ĐỘC QUYỀN TOP 1 Trang Chủ' : isPopular ? '⚡ Ghim ƯU TIÊN TOP 2 Trang Chủ' : 'Hiển thị bài đăng tiêu chuẩn',
                isVip ? '👑 Huy hiệu ★ PREMIUM Vàng Hoàng Gia' : isPopular ? '⚡ Huy hiệu ⚡ PRO Xanh Royal' : 'Quản lý ứng viên tự động',
                isVip ? '👑 Trợ lý AI HR Soạn JD & Phỏng vấn' : isPopular ? '⚡ Đánh giá AI độ phù hợp CV' : 'Hỗ trợ tuyển dụng 24/7',
              ],
              isPopular,
              isVip,
            };
          });

          const mapped = Object.values(mapByTier).sort((a, b) => a.priceNum - b.priceNum);
          setPackages(mapped);
        }
      },
      (error) => {
        console.log('Lỗi lắng nghe packages Firestore:', error);
      }
    );

    return () => unsub();
  }, []);

  const benefits = [
    {
      icon: 'eye-outline' as const,
      title: 'Tăng lượt tiếp cận',
      desc: 'Bài đăng của bạn tiếp cận nhiều ứng viên tiềm năng hơn gấp 3 lần.',
    },
    {
      icon: 'checkmark-circle-outline' as const,
      title: 'Huy hiệu xác minh',
      desc: 'Tăng độ uy tín với biểu tượng "Nhà tuyển dụng tin cậy".',
    },
    {
      icon: 'flash-outline' as const,
      title: 'Hỗ trợ ưu tiên',
      desc: 'Mọi thắc mắc của bạn sẽ được đội ngũ BybitJobs xử lý ngay lập tức.',
    },
  ];

  const handlePurchase = (pkg: PackageItem) => {
    router.push({
      pathname: '/recruiter/payment',
      params: {
        packageId: pkg.id,
        packageName: pkg.name,
        packagePrice: pkg.price,
        packagePriceNum: pkg.priceNum,
        packageDuration: pkg.duration,
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F5F7FA' }]}>
      {/* Top Navigation Bar */}
      <View style={[styles.navBar, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#11181C'} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
          Gói dịch vụ tuyển dụng
        </Text>
        <View style={styles.navPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Render Package Cards */}
        {packages.map((pkg) => {
          const currentTier = (activePkgInfo?.tier || 'FREE').toUpperCase();
          const isExpired = activePkgInfo?.isExpired;
          
          let isCurrentActivePkg = false;
          if (!isExpired) {
            if (pkg.id === 'premium' || pkg.isVip) isCurrentActivePkg = currentTier === 'PREMIUM';
            else if (pkg.id === 'pro' || pkg.isPopular) isCurrentActivePkg = currentTier === 'PRO';
            else if (pkg.id === 'free' || pkg.priceNum === 0) isCurrentActivePkg = currentTier === 'FREE';
          }

          let isLowerThanActivePkg = false;
          if (!isExpired) {
            if (currentTier === 'PREMIUM') isLowerThanActivePkg = pkg.id !== 'premium' && !pkg.isVip;
            else if (currentTier === 'PRO') isLowerThanActivePkg = pkg.id === 'free' || pkg.priceNum === 0;
          }

          let cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
          let textColor = isDark ? '#FFF' : '#11181C';
          let descColor = isDark ? '#9BA1A6' : '#687076';
          let buttonBg = isDark ? '#2C2C2E' : '#E5E7EB';
          let buttonText = isDark ? '#FFF' : '#11181C';

          if (isCurrentActivePkg) {
            cardBg = isDark ? '#064E3B' : '#ECFDF5';
            buttonBg = '#10B981';
            buttonText = '#FFFFFF';
          } else if (pkg.isPopular) {
            cardBg = isDark ? '#1E2D3D' : '#F0F8FF';
            buttonBg = '#0084FF';
            buttonText = '#FFFFFF';
          } else if (pkg.isVip) {
            cardBg = '#0A1E36';
            textColor = '#FFFFFF';
            descColor = '#A9C6E2';
            buttonBg = '#F59E0B';
            buttonText = '#FFFFFF';
          }

          return (
            <View
              key={pkg.id}
              style={[
                styles.packageCard,
                { backgroundColor: cardBg },
                isCurrentActivePkg && { borderColor: '#10B981', borderWidth: 2.5 },
                pkg.isPopular && !isCurrentActivePkg && styles.popularCard,
                isDark && { shadowColor: '#000', shadowOpacity: 0.3 },
              ]}
            >
              {/* Tags Row */}
              <View style={styles.tagsRow}>
                <View
                  style={[
                    styles.tagBubble,
                    {
                      backgroundColor: isCurrentActivePkg
                        ? '#10B981'
                        : pkg.isVip
                          ? '#E65100'
                          : pkg.isPopular
                            ? '#0084FF'
                            : isDark
                              ? '#2C2C2E'
                              : '#ECEFF1',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: isCurrentActivePkg || pkg.isVip || pkg.isPopular ? '#FFF' : isDark ? '#9BA1A6' : '#5E6E7A' },
                    ]}
                  >
                    {isCurrentActivePkg ? '✓ GÓI CỦA BẠN' : pkg.tag}
                  </Text>
                </View>

                {isCurrentActivePkg ? (
                  <View style={[styles.subTagBubble, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.subTagText}>
                      {activePkgInfo.remainingDays !== undefined ? `CÒN ${activePkgInfo.remainingDays} NGÀY` : 'ĐANG KÍCH HOẠT ✓'}
                    </Text>
                  </View>
                ) : pkg.subTag ? (
                  <View style={[styles.subTagBubble, { backgroundColor: pkg.isVip ? '#0084FF' : '#FF9800' }]}>
                    <Text style={styles.subTagText}>{pkg.subTag}</Text>
                  </View>
                ) : null}
              </View>

              {/* Title & Price */}
              <View style={styles.priceRow}>
                <Text style={[styles.packageName, { color: textColor }]}>{pkg.name}</Text>
                <Text
                  style={[
                    styles.packagePrice,
                    { color: isCurrentActivePkg ? '#10B981' : pkg.isPopular ? '#0084FF' : pkg.isVip ? '#F59E0B' : '#0084FF' },
                  ]}
                >
                  {pkg.price}
                </Text>
              </View>

              {/* Features List */}
              <View style={styles.featuresList}>
                {pkg.features.map((feature: string, idx: number) => (
                  <View key={idx} style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={isCurrentActivePkg ? '#10B981' : pkg.isVip ? '#F59E0B' : '#4CAF50'}
                      style={styles.featureIcon}
                    />
                    <Text style={[styles.featureText, { color: descColor }]}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Purchase / Active Button */}
              {isCurrentActivePkg ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    if (pkg.id === 'free') {
                      Alert.alert('Thông báo', 'Bạn đang sử dụng Gói Miễn Phí mặc định.');
                    } else {
                      Alert.alert(
                        'Đã Kích Hoạt',
                        `Bạn đang sử dụng ${pkg.name}. Hạn dùng còn ${activePkgInfo.remainingDays || 30} ngày.\nBạn có muốn gia hạn thêm gói này không?`,
                        [
                          { text: 'Đóng', style: 'cancel' },
                          { text: 'Gia hạn ngay', onPress: () => handlePurchase(pkg) }
                        ]
                      );
                    }
                  }}
                  style={[styles.buyButton, { backgroundColor: '#10B981' }]}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={[styles.buyButtonText, { color: '#FFFFFF', fontWeight: '800' }]}>
                    {pkg.id === 'free' ? '✓ Gói Đang Sử Dụng' : `✓ Đang Kích Hoạt (Gia Hạn)`}
                  </Text>
                </TouchableOpacity>
              ) : isLowerThanActivePkg ? (
                <View
                  style={[styles.buyButton, { backgroundColor: isDark ? '#2C2C2E' : '#E5E7EB', opacity: 0.75 }]}
                >
                  <Text style={[styles.buyButtonText, { color: isDark ? '#9BA1A6' : '#64748B' }]}>
                    Đã bao gồm trong gói {currentTier}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handlePurchase(pkg)}
                  style={[styles.buyButton, { backgroundColor: buttonBg }]}
                >
                  <Text style={[styles.buyButtonText, { color: buttonText }]}>
                    {pkg.isVip ? '👑 Mua Ngay Premium' : pkg.isPopular ? '⚡ Mua Ngay Pro' : 'Dùng Gói Này'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Benefits Header */}
        <Text style={[styles.benefitsTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
          Lợi ích khi nâng cấp
        </Text>

        {/* Benefits Cards */}
        {benefits.map((benefit, idx) => (
          <View
            key={idx}
            style={[
              styles.benefitCard,
              { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' },
            ]}
          >
            <View style={[styles.benefitIconFrame, { backgroundColor: isDark ? '#2C2C2E' : '#E6F4FE' }]}>
              <Ionicons name={benefit.icon} size={22} color="#0084FF" />
            </View>
            <View style={styles.benefitTextCol}>
              <Text style={[styles.benefitCardTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                {benefit.title}
              </Text>
              <Text style={[styles.benefitCardDesc, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                {benefit.desc}
              </Text>
            </View>
          </View>
        ))}

        {/* Bottom Promos */}
        <View style={styles.promoFrame}>
          <Image
            source={require('../../assets/images/small_jobs_banner.png')}
            style={styles.promoImage}
            resizeMode="cover"
          />
          <View style={styles.promoOverlay}>
            <Text style={styles.promoText}>Hàng ngàn doanh nghiệp đã tin dùng</Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  navPlaceholder: {
    width: 32,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  packageCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  popularCard: {
    borderWidth: 2,
    borderColor: '#0084FF',
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagBubble: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  subTagBubble: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  buyButton: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  benefitIconFrame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  benefitCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  promoFrame: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 30, 54, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  promoText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});
