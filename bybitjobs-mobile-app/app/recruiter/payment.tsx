import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

type PaymentMethod = 'bank' | 'momo' | 'zalopay';

export default function RecruiterPaymentScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { upgradePackage, seqId } = useAuth();

  // Route Parameters
  const { packageId, packageName, packagePrice, packagePriceNum, packageDuration } = useLocalSearchParams<{
    packageId: string;
    packageName: string;
    packagePrice: string;
    packagePriceNum: string;
    packageDuration: string;
  }>();

  // Local payment method state manager
  const [activeMethod, setActiveMethod] = React.useState<PaymentMethod>('bank');

  // Copy helper
  const handleCopy = (text: string) => {
    Alert.alert('Sao chép', `Đã sao chép thành công: ${text}`);
  };

  const handleConfirmPayment = () => {
    // 1. Simulating payment validation logic
    let apiPackageName: 'Free' | 'Gold' | 'Diamond' = 'Free';
    if (packageName?.includes('Standard')) {
      apiPackageName = 'Gold';
    } else if (packageName?.includes('Premium')) {
      apiPackageName = 'Diamond';
    }

    // 2. Perform Mock Upgrade in Context Storage
    upgradePackage(apiPackageName);

    // 3. Trigger Modal Success Dialog
    Alert.alert(
      'Giao dịch thành công',
      `Bạn đã thanh toán thành công đơn hàng ${packageName || 'Standard Package'}. Gói dịch vụ đã được kích hoạt trực tiếp trên tài khoản của bạn.`,
      [
        {
          text: 'Vào Dashboard quản lý',
          onPress: () => {
            // Navigate to Recruiter Dashboard Screen
            router.push('/recruiter/dashboard');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F5F7FA' }]}>
      {/* Top Header */}
      <View style={[styles.navBar, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#11181C'} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
          Thanh toán đơn hàng
        </Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.dismissAll()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={isDark ? '#FFF' : '#11181C'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Receipt Box */}
        <View style={[styles.receiptCard, { backgroundColor: isDark ? '#1E2D3D' : '#EBF5FF', borderColor: isDark ? '#293C4E' : '#BFDBFE' }]}>
          <View style={styles.packageIconBox}>
            <Ionicons name="cube-outline" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.receiptDetails}>
            <Text style={styles.receiptName}>{packageName || 'Standard Package'}</Text>
            <Text style={styles.receiptDuration}>Thời hạn: {packageDuration || '30 ngày'}</Text>
          </View>
          <Text style={styles.receiptPrice}>{packagePrice || '200.000đ'}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
          Phương thức thanh toán
        </Text>

        {/* Option 1: Bank Transfer Card */}
        <View
          style={[
            styles.optionCard,
            { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
            activeMethod === 'bank' ? styles.optionCardActive : styles.optionCardInactive,
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveMethod('bank')}
            style={styles.optionHeader}
          >
            <View style={styles.optionInfoLeft}>
              <Ionicons name="business-outline" size={22} color="#0084FF" />
              <Text style={[styles.optionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Chuyển khoản Ngân hàng
              </Text>
            </View>
            <Ionicons
              name={activeMethod === 'bank' ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={activeMethod === 'bank' ? '#0084FF' : '#8E8E93'}
            />
          </TouchableOpacity>

          {/* Conditional rendering for Bank Info */}
          {activeMethod === 'bank' && (
            <View style={[styles.bankInfoBox, { backgroundColor: isDark ? '#151718' : '#F8FAFC', borderColor: isDark ? '#2C2C2E' : '#E2E8F0' }]}>
              <Text style={[styles.bankPrompt, { color: isDark ? '#9BA1A6' : '#687076' }]}>
                Quét mã để thanh toán nhanh hoặc nhập thông tin chuyển khoản bên dưới.
              </Text>

              {/* QR Code Graphic */}
              <View style={styles.qrFrame}>
                <Image
                  source={{ uri: `https://img.vietqr.io/image/vcb-1031156481-compact.png?amount=${packagePriceNum}&addInfo=${encodeURIComponent(`ID ${seqId}`)}&accountName=${encodeURIComponent('PHAM NGOC THANH')}` }}
                  style={styles.qrImage}
                  resizeMode="cover"
                />
                <View style={styles.qrCodeLabelBox}>
                  <Text style={styles.qrCodeLabelText}>QUÉT MÃ ĐỂ THANH TOÁN</Text>
                </View>
              </View>

              {/* Grid properties */}
              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailKey, { color: isDark ? '#9BA1A6' : '#687076' }]}>Ngân hàng:</Text>
                  <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#11181C' }]}>Vietcombank</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailKey, { color: isDark ? '#9BA1A6' : '#687076' }]}>Chủ TK:</Text>
                  <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#11181C' }]}>PHAM NGOC THANH</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={[styles.detailKey, { color: isDark ? '#9BA1A6' : '#687076' }]}>Số TK:</Text>
                  <View style={styles.copyRow}>
                    <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#11181C', marginRight: 6 }]}>1031156481</Text>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => handleCopy('1031156481')}>
                      <Ionicons name="copy-outline" size={14} color="#0084FF" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.detailRow, { marginTop: 4 }]}>
                  <Text style={[styles.detailKey, { color: isDark ? '#9BA1A6' : '#687076' }]}>Nội dung:</Text>
                  <View style={styles.copyRow}>
                    <Text style={[styles.detailValue, { color: isDark ? '#FFF' : '#11181C', marginRight: 6 }]}>ID {seqId}</Text>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => handleCopy(`ID ${seqId}`)}>
                      <Ionicons name="copy-outline" size={14} color="#0084FF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Option 2: Ví Momo */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveMethod('momo')}
          style={[
            styles.optionCardHorizontal,
            { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
            activeMethod === 'momo' ? styles.optionCardActive : styles.optionCardInactive,
          ]}
        >
          <View style={styles.optionInfoLeft}>
            <View style={[styles.momoLogoFrame, { backgroundColor: '#A21C65' }]}>
              <Text style={styles.momoTextLabel}>momo</Text>
            </View>
            <Text style={[styles.optionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>Ví Momo</Text>
          </View>
          <Ionicons
            name={activeMethod === 'momo' ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={activeMethod === 'momo' ? '#0084FF' : '#8E8E93'}
          />
        </TouchableOpacity>

        {/* Option 3: ZaloPay */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setActiveMethod('zalopay')}
          style={[
            styles.optionCardHorizontal,
            { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
            activeMethod === 'zalopay' ? styles.optionCardActive : styles.optionCardInactive,
          ]}
        >
          <View style={styles.optionInfoLeft}>
            <View style={[styles.zalopayLogoFrame, { backgroundColor: '#00A6C7' }]}>
              <Text style={styles.zalopayTextLabel}>Zalo</Text>
            </View>
            <Text style={[styles.optionTitle, { color: isDark ? '#FFF' : '#11181C' }]}>ZaloPay</Text>
          </View>
          <Ionicons
            name={activeMethod === 'zalopay' ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={activeMethod === 'zalopay' ? '#0084FF' : '#8E8E93'}
          />
        </TouchableOpacity>

        {/* Large Submit Confirmation Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleConfirmPayment}
          style={styles.payButton}
        >
          <Text style={styles.payButtonText}>Tôi đã thanh toán</Text>
          <Ionicons name="checkmark" size={18} color="#FFF" style={styles.payButtonIcon} />
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
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
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  receiptCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  packageIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#0084FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptDetails: {
    flex: 1,
    marginLeft: 12,
  },
  receiptName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D47A1',
  },
  receiptDuration: {
    fontSize: 11,
    color: '#1565C0',
    marginTop: 2,
  },
  receiptPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0084FF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  optionCardHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  optionCardActive: {
    borderColor: '#0084FF',
  },
  optionCardInactive: {
    borderColor: '#E5E7EB',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
  },
  momoLogoFrame: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  momoTextLabel: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  zalopayLogoFrame: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zalopayTextLabel: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  bankInfoBox: {
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  bankPrompt: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  qrFrame: {
    width: 140,
    height: 140,
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrCodeLabelBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  qrCodeLabelText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  detailsList: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payButton: {
    backgroundColor: '#0056A8',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
    shadowColor: '#0056A8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  payButtonIcon: {
    marginLeft: 6,
  },
  bottomSpacer: {
    height: 40,
  },
});
