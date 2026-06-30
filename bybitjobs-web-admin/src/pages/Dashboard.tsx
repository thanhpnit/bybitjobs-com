import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useTheme } from '../context/ThemeContext';
import { Wallet, Users as UsersIcon, FileText, AlertCircle, Star, CheckCircle2 } from 'lucide-react-native';
import { MockChart } from '../components/ui/MockChart';
import { useData } from '../context/DataContext';

const screenWidth = Dimensions.get('window').width;

export const Dashboard: React.FC = () => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const { users, jobPosts, reports, reviews } = useData();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://160.250.246.119:4000/api/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.slice(0, 5).map((item: any) => {
            const dateObj = new Date(item.createdAt);
            const dateStr = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
            return {
              id: `#TXN-${item.orderCode}`,
              date: dateStr,
              name: item.companyName || 'Không xác định',
              amount: `${Number(item.price || 0).toLocaleString()}đ`,
              method: 'PayOS',
              status: item.status === 'success' ? 'success' : (item.status === 'pending' ? 'warning' : 'danger')
            };
          });
          setRecentTransactions(mapped);
        }
      })
      .catch(err => console.error('Lỗi lấy giao dịch gần đây:', err));
  }, []);

  const parseDDMMYYYY = (str: string) => {
    if (!str) return new Date();
    const parts = str.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return new Date(str);
  };

  const parseTransactionDate = (str: string) => {
    if (!str) return new Date();
    const [datePart, timePart] = str.split(' ');
    if (!datePart) return new Date(str);
    const parts = datePart.split('/');
    const timeParts = timePart ? timePart.split(':') : [0, 0];
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), Number(timeParts[0] || 0), Number(timeParts[1] || 0));
    }
    return new Date(str);
  };

  const getRelativeTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 1) return 'VỪA XONG';
    if (diffMins < 60) return `${diffMins} PHÚT TRƯỚC`;
    if (diffHours < 24) return `${diffHours} GIỜ TRƯỚC`;
    return `${diffDays} NGÀY TRƯỚC`;
  };

  const activities = React.useMemo(() => {
    const list: any[] = [];

    // Helper to safely parse any date format into a Date object
    const toDate = (val: any): Date => {
      if (!val) return new Date();
      if (val instanceof Date) return val;
      if (val.toDate && typeof val.toDate === 'function') return val.toDate(); // Firebase Timestamp
      if (typeof val === 'number') return new Date(val);
      if (typeof val === 'string') {
        // Handle DD/MM/YYYY
        const parts = val.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          return new Date(year, month, day);
        }
        return new Date(val);
      }
      return new Date();
    };

    // Báo cáo vi phạm
    reports.forEach((item) => {
      const statusLabel = item.status === 'Chờ xử lý' ? '⏳ Chờ xử lý' : (item.status === 'Đã xử lý' ? '✅ Đã xử lý' : item.status);
      list.push({
        title: `Báo cáo vi phạm - ${statusLabel}`,
        description: `${item.user || 'Ẩn danh'} báo cáo ${item.target || 'tin đăng'}: ${item.reason}`,
        date: toDate(item.date),
        iconName: 'AlertCircle',
        color: colors.dangerText,
        bgColor: colors.dangerBg,
      });
    });

    // Đánh giá công ty
    reviews.forEach((item) => {
      const isApproved = item.status === 'Đã duyệt';
      list.push({
        title: isApproved ? 'Đánh giá đã duyệt' : 'Đánh giá chờ duyệt',
        description: `${item.user || 'Ẩn danh'} đánh giá ${item.company || 'công ty'}: "${item.comment}" (${item.rating}⭐)`,
        date: toDate(item.date),
        iconName: isApproved ? 'CheckCircle2' : 'Star',
        color: isApproved ? colors.successText : colors.warningText,
        bgColor: isApproved ? colors.successBg : colors.warningBg,
      });
    });

    // Tin tuyển dụng
    jobPosts.forEach((item) => {
      list.push({
        title: 'Tin tuyển dụng mới',
        description: `${item.title} tại ${item.company || 'Doanh nghiệp'}`,
        date: toDate(item.createdAt || item.date),
        iconName: 'FileText',
        color: colors.warningText,
        bgColor: colors.warningBg,
      });
    });

    // Người dùng đăng ký
    users.forEach((item) => {
      list.push({
        title: 'Người dùng mới đăng ký',
        description: `${item.name || 'Thành viên mới'} (${item.job || 'Người tìm việc'})`,
        date: toDate(item.createdAt || item.date),
        iconName: 'UsersIcon',
        color: colors.successText,
        bgColor: colors.successBg,
      });
    });

    // Giao dịch thanh toán
    recentTransactions.forEach((item) => {
      list.push({
        title: 'Thanh toán thành công',
        description: `${item.name} đã mua gói dịch vụ ${item.amount}`,
        date: toDate(item.date),
        iconName: 'Wallet',
        color: colors.infoText,
        bgColor: colors.infoBg,
      });
    });

    return list
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [reports, reviews, jobPosts, users, recentTransactions, colors]);

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
          <Typography variant="h4" style={{ marginBottom: 16 }}>Hoạt động gần đây ({activities.length})</Typography>
          <View style={styles.activityScrollArea}>
          {activities.length === 0 ? (
            <Typography variant="body2" color="secondary">Chưa có hoạt động nào gần đây.</Typography>
          ) : (
            activities.map((act, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: act.bgColor }]}>
                  {act.iconName === 'Wallet' && <Wallet color={act.color} size={16} />}
                  {act.iconName === 'UsersIcon' && <UsersIcon color={act.color} size={16} />}
                  {act.iconName === 'FileText' && <FileText color={act.color} size={16} />}
                  {act.iconName === 'AlertCircle' && <AlertCircle color={act.color} size={16} />}
                  {act.iconName === 'Star' && <Star color={act.color} size={16} />}
                  {act.iconName === 'CheckCircle2' && <CheckCircle2 color={act.color} size={16} />}
                </View>
                <View style={styles.activityContent}>
                  <Typography variant="subtitle2">{act.title}</Typography>
                  <Typography variant="body2" color="secondary" numberOfLines={1}>{act.description}</Typography>
                  <Typography variant="caption" color="muted">{getRelativeTime(act.date)}</Typography>
                </View>
              </View>
            ))
          )}
          </View>
        </Card>
      </View>

      <Card style={styles.transactionSection}>
        <View style={styles.sectionHeader}>
          <Typography variant="h4">Giao dịch thanh toán gần nhất</Typography>
          <Typography variant="subtitle2" color="brand">Xem tất cả</Typography>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 900, flex: 1 }}>
            <View style={[styles.tableHeader, { backgroundColor: colors.bgSecondary }]}>
              <Typography variant="caption" color="muted" style={styles.colId}>MÃ GIAO DỊCH</Typography>
              <Typography variant="caption" color="muted" style={styles.colDate}>NGÀY THANH TOÁN</Typography>
              <Typography variant="caption" color="muted" style={styles.colCustomer}>KHÁCH HÀNG</Typography>
              <Typography variant="caption" color="muted" style={styles.colAmount}>SỐ TIỀN</Typography>
              <Typography variant="caption" color="muted" style={styles.colMethod}>PHƯƠNG THỨC</Typography>
              <Typography variant="caption" color="muted" style={styles.colStatus}>TRẠNG THÁI</Typography>
            </View>

            {recentTransactions.map((item, index) => (
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
                    {item.status === 'success' ? 'Thành công' : (item.status === 'warning' ? 'Đang chờ' : 'Thất bại')}
                  </Badge>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
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
    maxHeight: 500,
  },
  activityScrollArea: {
    flex: 1,
    overflow: 'scroll' as any,
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
