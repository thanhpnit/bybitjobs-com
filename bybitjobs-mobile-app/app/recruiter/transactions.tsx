import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';

export default function RecruiterTransactionsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { orders } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#34C759'; // Green
      case 'pending':
        return '#FF9500'; // Orange
      case 'failed':
        return '#FF3B30'; // Red
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Thành công';
      case 'pending':
        return 'Đang xử lý';
      case 'failed':
        return 'Thất bại';
      default:
        return status;
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
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
          Lịch sử giao dịch
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {(!orders || orders.length === 0) ? (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={48} color={isDark ? '#3A3A3C' : '#D1D5DB'} />
            <Text style={[styles.emptyText, { color: isDark ? '#8E8E93' : '#6B7280' }]}>
              Chưa có giao dịch nào
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <View 
              key={order.id} 
              style={[
                styles.orderCard, 
                { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: isDark ? '#2C2C2E' : '#E5E7EB' }
              ]}
            >
              <View style={styles.orderHeader}>
                <Text style={[styles.orderPackageName, { color: isDark ? '#FFF' : '#11181C' }]}>
                  {order.packageName}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.orderDivider} />

              <View style={styles.orderDetailRow}>
                <Text style={styles.detailLabel}>Mã ĐH:</Text>
                <Text style={[styles.detailValue, { color: isDark ? '#E5E5EA' : '#3A3A3C' }]}>
                  {order.id}
                </Text>
              </View>

              <View style={styles.orderDetailRow}>
                <Text style={styles.detailLabel}>Thời gian:</Text>
                <Text style={[styles.detailValue, { color: isDark ? '#E5E5EA' : '#3A3A3C' }]}>
                  {formatDate(order.createdAt)}
                </Text>
              </View>

              <View style={styles.orderDetailRow}>
                <Text style={styles.detailLabel}>Tổng tiền:</Text>
                <Text style={[styles.priceText, { color: '#0084FF' }]}>
                  {order.price}đ
                </Text>
              </View>
            </View>
          ))
        )}
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
  scrollContent: {
    padding: 16,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPackageName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    opacity: 0.5,
    marginVertical: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
