import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../src/config/firebase';

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

  const [packages, setPackages] = React.useState<PackageItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'packages'), (snapshot) => {
      const data: PackageItem[] = [];
      snapshot.forEach((doc) => {
        const pkg = doc.data();
        data.push({
          id: pkg.id,
          name: pkg.name,
          price: pkg.price,
          priceNum: pkg.priceNum || 0,
          duration: pkg.period ? pkg.period.replace('/', '').trim() : '',
          tag: `TRẠNG THÁI: ${pkg.badge || ''}`,
          features: [
            `Số lượng: ${pkg.posts || ''}`,
            `Lượt nhận CV: ${pkg.cvs || ''}`,
          ],
          isPopular: pkg.isPopular,
          isVip: pkg.id === 'premium' || pkg.name?.toLowerCase().includes('premium'),
        });
      });
      // Sort by priceNum to keep them in order
      data.sort((a, b) => a.priceNum - b.priceNum);
      setPackages(data);
      setLoading(false);
    }, (err) => {
      console.log('Lỗi fetch packages:', err);
      setLoading(false);
    });

    return () => unsubscribe();
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
          let cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
          let textColor = isDark ? '#FFF' : '#11181C';
          let descColor = isDark ? '#9BA1A6' : '#687076';
          let buttonBg = isDark ? '#2C2C2E' : '#E5E7EB';
          let buttonText = isDark ? '#FFF' : '#11181C';

          if (pkg.isPopular) {
            cardBg = isDark ? '#1E2D3D' : '#F0F8FF';
            buttonBg = '#0084FF';
            buttonText = '#FFFFFF';
          } else if (pkg.isVip) {
            cardBg = '#0A1E36';
            textColor = '#FFFFFF';
            descColor = '#A9C6E2';
            buttonBg = '#FFFFFF';
            buttonText = '#0A1E36';
          }

          return (
            <View
              key={pkg.id}
              style={[
                styles.packageCard,
                { backgroundColor: cardBg },
                pkg.isPopular && styles.popularCard,
                isDark && { shadowColor: '#000', shadowOpacity: 0.3 },
              ]}
            >
              {/* Tags Row */}
              <View style={styles.tagsRow}>
                <View
                  style={[
                    styles.tagBubble,
                    {
                      backgroundColor: pkg.isVip
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
                      { color: pkg.isVip || pkg.isPopular ? '#FFF' : isDark ? '#9BA1A6' : '#5E6E7A' },
                    ]}
                  >
                    {pkg.tag}
                  </Text>
                </View>

                {pkg.subTag && (
                  <View style={[styles.subTagBubble, { backgroundColor: pkg.isVip ? '#0084FF' : '#FF9800' }]}>
                    <Text style={styles.subTagText}>{pkg.subTag}</Text>
                  </View>
                )}
              </View>

              {/* Title & Price */}
              <View style={styles.priceRow}>
                <Text style={[styles.packageName, { color: textColor }]}>{pkg.name}</Text>
                <Text
                  style={[
                    styles.packagePrice,
                    { color: pkg.isPopular ? '#0084FF' : pkg.isVip ? '#FFF' : '#0084FF' },
                  ]}
                >
                  {pkg.price}
                </Text>
              </View>

              {/* Features List */}
              <View style={styles.featuresList}>
                {pkg.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={pkg.isVip ? '#82C1F5' : '#4CAF50'}
                      style={styles.featureIcon}
                    />
                    <Text style={[styles.featureText, { color: descColor }]}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Purchase Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePurchase(pkg)}
                style={[styles.buyButton, { backgroundColor: buttonBg }]}
              >
                <Text style={[styles.buyButtonText, { color: buttonText }]}>Mua ngay</Text>
              </TouchableOpacity>
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
