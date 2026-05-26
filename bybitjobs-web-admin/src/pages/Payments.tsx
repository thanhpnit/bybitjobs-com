import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Filter, Download, ArrowUpRight, MoreVertical } from 'lucide-react-native';
import { MockChart } from '../components/ui/MockChart';
import { PaymentConfigTab } from './PaymentConfigTab';

const screenWidth = Dimensions.get('window').width;

const transactions = [
  { id: '#TXN-88291', company: 'Công ty TechCore', package: 'GÓI PREMIUM', amount: '2.500.000 đ', method: 'Chuyển khoản', status: 'Completed', color: '#D97706', bg: '#FEF3C7' },
  { id: '#TXN-88290', company: 'Gia Phong Group', package: 'GÓI CƠ BẢN', amount: '500.000 đ', method: 'Thẻ Visa', status: 'Pending', color: '#6B7280', bg: '#F3F4F6' },
  { id: '#TXN-88289', company: 'LogiMove JSC', package: 'GÓI DOANH NGHIỆP', amount: '12.000.000 đ', method: 'Ví MoMo', status: 'Failed', color: '#0066FF', bg: '#E6F0FF' },
  { id: '#TXN-88288', company: 'VinaGoods LTD', package: 'GÓI PREMIUM', amount: '2.500.000 đ', method: 'Chuyển khoản', status: 'Completed', color: '#D97706', bg: '#FEF3C7' },
];

export const Payments: React.FC = () => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'config'>('overview');

  return (
    <View style={styles.container}>
      <View style={[styles.tabsHeader, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'overview' && [styles.tabActive, { borderBottomColor: colors.primaryColor }]]}
          onPress={() => setActiveTab('overview')}
        >
          <Typography variant="subtitle2" color={activeTab === 'overview' ? 'primary' : 'secondary'}>Tổng quan giao dịch</Typography>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'config' && [styles.tabActive, { borderBottomColor: colors.primaryColor }]]}
          onPress={() => setActiveTab('config')}
        >
          <Typography variant="subtitle2" color={activeTab === 'config' ? 'primary' : 'secondary'}>Cấu hình nhận tiền</Typography>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' ? (
        <>
          <View style={styles.topGrid}>
            <Card style={styles.chartCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                <View>
                  <Typography variant="h3">Doanh thu 7 ngày qua</Typography>
                  <Typography variant="body2" color="secondary" style={{ marginTop: 4 }}>Tổng cộng: 45.200.000 VNĐ</Typography>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ArrowUpRight color={colors.primaryColor} size={16} />
                  <Typography variant="subtitle2" color="brand">+12.5%</Typography>
                </View>
              </View>
              
              <MockChart
                type="line"
                labels={["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"]}
                data={[15, 25, 45, 30, 60, 50, 70]}
                height={220}
              />
            </Card>

            <View style={styles.rightStats}>
              <Card style={[styles.statCardSolid, { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }]}>
                <Typography variant="subtitle2" style={{ color: 'rgba(255,255,255,0.8)' }}>Giao dịch hôm nay</Typography>
                <Typography variant="h1" style={{ color: '#fff', marginVertical: 12 }}>128 Giao dịch</Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ArrowUpRight color="#fff" size={16} />
                  <Typography variant="body2" style={{ color: '#fff' }}>Tăng 8% so với hôm qua</Typography>
                </View>
              </Card>

              <Card style={styles.statCard}>
                <Typography variant="subtitle2" color="secondary">Tỷ lệ thanh toán thành công</Typography>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <Typography variant="h1">98.4%</Typography>
                  <View style={[styles.circleBadge, { borderColor: colors.successText }]}>
                    <Typography variant="caption" color="success" style={{ fontWeight: '700' }}>Safe</Typography>
                  </View>
                </View>
              </Card>
            </View>
          </View>

      <Card style={styles.tableCard}>
        <View style={styles.filterBar}>
          <Typography variant="h3">Danh sách giao dịch</Typography>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button variant="outline" icon={<Filter size={18} color={colors.textSecondary} />}>Bộ lọc</Button>
            <Button variant="outline" icon={<Download size={18} color={colors.textSecondary} />}>Xuất Excel</Button>
          </View>
        </View>

        <View style={[styles.tableHeader, { backgroundColor: colors.bgSecondary }]}>
          <Typography variant="caption" color="muted" style={styles.colId}>Mã giao dịch</Typography>
          <Typography variant="caption" color="muted" style={styles.colCompany}>Nhà tuyển dụng</Typography>
          <Typography variant="caption" color="muted" style={styles.colPackage}>Gói dịch vụ</Typography>
          <Typography variant="caption" color="muted" style={styles.colAmount}>Số tiền</Typography>
          <Typography variant="caption" color="muted" style={styles.colMethod}>Phương thức</Typography>
          <Typography variant="caption" color="muted" style={styles.colStatus}>Trạng thái</Typography>
          <Typography variant="caption" color="muted" style={styles.colAction}>Hành động</Typography>
        </View>

        {transactions.map((item, index) => (
          <View key={index} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
            <Typography variant="subtitle2" color="brand" style={styles.colId}>{item.id}</Typography>
            <View style={[styles.colCompany, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
              <View style={[styles.avatarRound, { backgroundColor: colors.infoBg }]}><Typography variant="caption" color="info" style={{ fontWeight: '700' }}>{item.company.substring(0, 2).toUpperCase()}</Typography></View>
              <Typography variant="subtitle2">{item.company}</Typography>
            </View>
            <View style={styles.colPackage}>
              <View style={[styles.chip, { backgroundColor: item.bg }]}><Typography variant="caption" style={{ color: item.color, fontWeight: '700' }}>{item.package}</Typography></View>
            </View>
            <Typography variant="h4" style={styles.colAmount}>{item.amount}</Typography>
            <View style={[styles.colMethod, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <View style={[styles.methodIcon, { backgroundColor: colors.bgSecondary }]} />
              <Typography variant="body2">{item.method}</Typography>
            </View>
            <View style={styles.colStatus}>
              <Badge status={item.status === 'Completed' ? 'success' : item.status === 'Pending' ? 'warning' : 'danger'}>
                • {item.status}
              </Badge>
            </View>
            <View style={styles.colAction}>
              <TouchableOpacity><MoreVertical color={colors.textSecondary} size={20} /></TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.pagination}>
          <Typography variant="body2" color="secondary">Hiển thị 1 - 4 trên 150 giao dịch</Typography>
          <View style={styles.pageNumbers}>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><Typography variant="body2" color="secondary">Trước</Typography></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }]}><Typography variant="body2" style={{ color: '#fff' }}>1</Typography></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><Typography variant="body2">2</Typography></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><Typography variant="body2">3</Typography></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><Typography variant="body2" color="secondary">Sau</Typography></TouchableOpacity>
          </View>
        </View>
      </Card>
      </>
      ) : (
        <PaymentConfigTab />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 24, paddingBottom: 40 },
  topGrid: { flexDirection: 'row', gap: 24 },
  chartCard: { flex: 2 },
  rightStats: { flex: 1, gap: 24 },
  statCardSolid: { flex: 1, justifyContent: 'center' },
  statCard: { flex: 1, justifyContent: 'center' },
  circleBadge: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  tableCard: { padding: 0 },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  tableHeader: { flexDirection: 'row', padding: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  tableRow: { flexDirection: 'row', padding: 24, borderBottomWidth: 1, alignItems: 'center' },
  colId: { flex: 1 },
  colCompany: { flex: 2 },
  colPackage: { flex: 1.5 },
  colAmount: { flex: 1.5 },
  colMethod: { flex: 1.5 },
  colStatus: { flex: 1.5 },
  colAction: { flex: 0.5, alignItems: 'flex-end' },
  avatarRound: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' },
  methodIcon: { width: 24, height: 24, borderRadius: 4 },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  pageNumbers: { flexDirection: 'row', gap: 8 },
  pageBtn: { height: 36, minWidth: 36, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabsHeader: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 24 },
  tabBtn: { paddingVertical: 12, paddingHorizontal: 24, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive: { }
});
