import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useTheme } from '../context/ThemeContext';
import { Wallet, Users as UsersIcon, FileText, AlertCircle } from 'lucide-react-native';
import { MockChart } from '../components/ui/MockChart';
import { useData } from '../context/DataContext';

const screenWidth = Dimensions.get('window').width;

export const Dashboard: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const { users, jobPosts, reports } = useData();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h2">Tổng quan hệ thống</Typography>
        <Typography variant="body1" color="secondary">
          Chào mừng quay trở lại, đây là dữ liệu cập nhật mới nhất cho BybitJobs
        </Typography>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.infoBg }]}>
            <Wallet color={colors.infoText} size={24} />
          </View>
          <View style={styles.statInfo}>
            <Typography variant="body2" color="secondary">Tổng doanh thu</Typography>
            <Typography variant="h3">128.500.000đ</Typography>
            <Typography variant="caption" color="success">~ +12%</Typography>
          </View>
        </Card>
        
        <Card style={styles.statCard}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.successBg }]}>
            <UsersIcon color={colors.successText} size={24} />
          </View>
          <View style={styles.statInfo}>
            <Typography variant="body2" color="secondary">Tổng người dùng</Typography>
            <Typography variant="h3">{users.length}</Typography>
            <Typography variant="caption" color="success">~ +{(users.length * 0.05).toFixed(1)}%</Typography>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.warningBg }]}>
            <FileText color={colors.warningText} size={24} />
          </View>
          <View style={styles.statInfo}>
            <Typography variant="body2" color="secondary">Số bài đăng</Typography>
            <Typography variant="h3">{jobPosts.length}</Typography>
            <Typography variant="caption" color="info">~ Ổn định</Typography>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.dangerBg }]}>
            <AlertCircle color={colors.dangerText} size={24} />
          </View>
          <View style={styles.statInfo}>
            <Typography variant="body2" color="secondary">Báo cáo mới</Typography>
            <Typography variant="h3">{reports.filter(r => r.status === 'Chờ xử lý').length}</Typography>
            <Typography variant="caption" color="danger">! Cần xử lý</Typography>
          </View>
        </Card>
      </View>

      <View style={styles.mainGrid}>
        <Card style={styles.chartSection}>
          <Typography variant="h4" style={{ marginBottom: 24 }}>Xu hướng doanh thu (7 ngày qua)</Typography>
          
          <MockChart
            type="line"
            labels={["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"]}
            data={[20, 25, 45, 30, 55, 40, 45]}
            height={260}
          />
        </Card>

        <Card style={styles.activitySection}>
          <Typography variant="h4" style={{ marginBottom: 24 }}>Hoạt động gần đây</Typography>
          
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: colors.dangerBg }]}>
              <AlertCircle color={colors.dangerText} size={16} />
            </View>
            <View style={styles.activityContent}>
              <Typography variant="subtitle2">Báo cáo vi phạm mới</Typography>
              <Typography variant="body2" color="secondary">Nội dung bài đăng không phù hợp</Typography>
              <Typography variant="caption" color="muted">15 PHÚT TRƯỚC</Typography>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: colors.successBg }]}>
              <UsersIcon color={colors.successText} size={16} />
            </View>
            <View style={styles.activityContent}>
              <Typography variant="subtitle2">Doanh nghiệp mới đăng ký</Typography>
              <Typography variant="body2" color="secondary">Công ty Công nghệ Alpha</Typography>
              <Typography variant="caption" color="muted">1 GIỜ TRƯỚC</Typography>
            </View>
          </View>
        </Card>
      </View>

      <Card style={styles.transactionSection}>
        <View style={styles.sectionHeader}>
          <Typography variant="h4">Giao dịch thanh toán gần nhất</Typography>
          <Typography variant="subtitle2" color="brand">Xem tất cả</Typography>
        </View>

        <View style={styles.tableHeader}>
          <Typography variant="caption" color="muted" style={styles.colId}>MÃ GIAO DỊCH</Typography>
          <Typography variant="caption" color="muted" style={styles.colDate}>NGÀY THANH TOÁN</Typography>
          <Typography variant="caption" color="muted" style={styles.colCustomer}>KHÁCH HÀNG</Typography>
          <Typography variant="caption" color="muted" style={styles.colAmount}>SỐ TIỀN</Typography>
          <Typography variant="caption" color="muted" style={styles.colMethod}>PHƯƠNG THỨC</Typography>
          <Typography variant="caption" color="muted" style={styles.colStatus}>TRẠNG THÁI</Typography>
        </View>

        {[
          { id: '#PAY-9821', date: '12/10/2023 14:30', name: 'Trần Văn A', amount: '500.000đ', method: 'Momo', status: 'success' },
          { id: '#PAY-9819', date: '12/10/2023 12:15', name: 'Nguyễn Thị B', amount: '1.200.000đ', method: 'Thẻ ATM nội địa', status: 'success' },
          { id: '#PAY-9815', date: '11/10/2023 18:45', name: 'Phạm Minh C', amount: '200.000đ', method: 'ZaloPay', status: 'warning' },
        ].map((item, index) => (
          <View key={index} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
            <Typography variant="subtitle2" style={styles.colId}>{item.id}</Typography>
            <Typography variant="body2" color="secondary" style={styles.colDate}>{item.date}</Typography>
            <View style={[styles.colCustomer, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.borderLight }]} />
              <Typography variant="body2">{item.name}</Typography>
            </View>
            <Typography variant="subtitle2" color="brand" style={styles.colAmount}>{item.amount}</Typography>
            <Typography variant="body2" color="secondary" style={styles.colMethod}>{item.method}</Typography>
            <View style={styles.colStatus}>
              <Badge status={item.status as any}>
                {item.status === 'success' ? 'Thành công' : 'Đang chờ'}
              </Badge>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statInfo: {
    gap: 4,
  },
  mainGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  chartSection: {
    flex: 2,
    minHeight: 360,
  },
  activitySection: {
    flex: 1,
    minHeight: 360,
  },
  activityItem: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  transactionSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // will override in code ideally, but fine for now
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  colId: { flex: 1 },
  colDate: { flex: 1.5 },
  colCustomer: { flex: 2 },
  colAmount: { flex: 1 },
  colMethod: { flex: 1.5 },
  colStatus: { flex: 1 },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
  }
});
