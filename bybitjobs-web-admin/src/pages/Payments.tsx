import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Filter, Download, ArrowUpRight, MoreVertical } from 'lucide-react-native';
import { MockChart } from '../components/ui/MockChart';
import { DatePicker } from '../components/ui/DatePicker';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

const screenWidth = Dimensions.get('window').width;

import { useEffect } from 'react';
export const Payments: React.FC = () => {
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterForm, setFilterForm] = useState({ company: '', minPrice: '', maxPrice: '' });
  const [appliedFilters, setAppliedFilters] = useState({ company: '', minPrice: '', maxPrice: '' });

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Luôn luôn kết nối trực tiếp tới IP VPS thật
  const apiHost = '160.250.246.119';

  useEffect(() => {
    fetch(`http://${apiHost}:4000/api/orders`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((item: any) => {
            const dateObj = new Date(item.createdAt);
            let finalStatus = item.status;
            if (finalStatus === 'pending') {
              const isExpired = Date.now() - dateObj.getTime() > 10 * 60 * 1000;
              if (isExpired) finalStatus = 'failed';
            }

            return {
              id: `#TXN-${item.orderCode}`,
              company: item.companyName || 'Không xác định',
              package: (item.packageName || 'Gói dịch vụ').toUpperCase(),
              amount: `${Number(item.price || 0).toLocaleString()} đ`,
              rawPrice: Number(item.price || 0),
              rawDate: dateObj,
              method: 'PayOS',
              time: dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
              status: finalStatus === 'success' ? 'Completed' : finalStatus === 'pending' ? 'Pending' : 'Failed',
              color: item.packageId === 'premium' ? '#D97706' : (item.packageId === 'diamond' ? '#0066FF' : '#6B7280'),
              bg: item.packageId === 'premium' ? '#FEF3C7' : (item.packageId === 'diamond' ? '#E6F0FF' : '#F3F4F6')
            };
          });
          setTransactions(mapped);
        }
      })
      .catch(err => console.error('Lỗi lấy danh sách giao dịch:', err));
  }, []);

  const dateFilteredTransactions = React.useMemo(() => {
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    return transactions.filter(item => item.rawDate >= start && item.rawDate <= end);
  }, [transactions, fromDate, toDate]);

  const filteredTransactions = React.useMemo(() => {
    return dateFilteredTransactions.filter(item => {
      // Basic search
      const matchSearch = item.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.package.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      // Advanced filters
      if (appliedFilters.company && !item.company.toLowerCase().includes(appliedFilters.company.toLowerCase())) return false;
      
      if (appliedFilters.minPrice) {
        const min = parseInt(appliedFilters.minPrice, 10);
        if (!isNaN(min) && item.rawPrice < min) return false;
      }
      
      if (appliedFilters.maxPrice) {
        const max = parseInt(appliedFilters.maxPrice, 10);
        if (!isNaN(max) && item.rawPrice > max) return false;
      }
      
      return true;
    });
  }, [dateFilteredTransactions, searchQuery, appliedFilters]);

  const totalRevenue = React.useMemo(() => {
    return dateFilteredTransactions
      .filter(t => t.status === 'Completed')
      .reduce((sum, t) => sum + t.rawPrice, 0);
  }, [dateFilteredTransactions]);

  const chartData = React.useMemo(() => {
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    
    const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))) + 1;
    
    const labels = [];
    const data = [];
    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
      
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dailyRev = dateFilteredTransactions
        .filter(t => t.status === 'Completed' && t.rawDate >= dayStart && t.rawDate <= dayEnd)
        .reduce((sum, t) => sum + t.rawPrice, 0);
      data.push(dailyRev);
    }
    
    return { labels, data };
  }, [dateFilteredTransactions, fromDate, toDate]);

  const todayStats = React.useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(todayEnd.getDate() - 1);
    
    const todayCount = transactions.filter(t => t.rawDate >= todayStart && t.rawDate <= todayEnd).length;
    const yesterdayCount = transactions.filter(t => t.rawDate >= yesterdayStart && t.rawDate <= yesterdayEnd).length;
    
    let growth = 0;
    let growthText = "Không đổi";
    if (yesterdayCount > 0) {
      growth = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
      if (growth > 0) growthText = `Tăng ${growth.toFixed(1)}% so với hôm qua`;
      else if (growth < 0) growthText = `Giảm ${Math.abs(growth).toFixed(1)}% so với hôm qua`;
    } else if (todayCount > 0) {
      growthText = `Tăng 100% so với hôm qua`;
    }
    
    return { count: todayCount, growthText };
  }, [transactions]);

  const successRate = React.useMemo(() => {
    if (dateFilteredTransactions.length === 0) return "0.0";
    const successCount = dateFilteredTransactions.filter(t => t.status === 'Completed').length;
    return ((successCount / dateFilteredTransactions.length) * 100).toFixed(1);
  }, [dateFilteredTransactions]);

  const handleApplyFilter = () => {
    setAppliedFilters(filterForm);
    setIsFilterModalOpen(false);
  };

  const handleClearFilter = () => {
    const empty = { company: '', minPrice: '', maxPrice: '' };
    setFilterForm(empty);
    setAppliedFilters(empty);
    setIsFilterModalOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginBottom: -8 }}>
        <DatePicker 
          label="Từ ngày" 
          value={fromDate} 
          onChange={setFromDate} 
          style={{ width: 150 }} 
        />
        <DatePicker 
          label="Đến ngày" 
          value={toDate} 
          onChange={setToDate} 
          style={{ width: 150 }} 
        />
      </View>

      <View style={styles.topGrid}>
            <Card style={styles.chartCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                <View>
                  <Typography variant="h3">Doanh thu (Khoảng ngày chọn)</Typography>
                  <Typography variant="body2" color="secondary" style={{ marginTop: 4 }}>Tổng cộng: {totalRevenue.toLocaleString()} VNĐ</Typography>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ArrowUpRight color={colors.primaryColor} size={16} />
                  <Typography variant="subtitle2" color="brand">Thực tế</Typography>
                </View>
              </View>
              
              <MockChart
                type="bar"
                labels={chartData.labels}
                data={chartData.data.length > 0 && Math.max(...chartData.data) > 0 ? chartData.data : [100, 100]}
                height={220}
              />
            </Card>

            <View style={styles.rightStats}>
              <Card style={[styles.statCardSolid, { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }]}>
                <Typography variant="subtitle2" style={{ color: 'rgba(255,255,255,0.8)' }}>Giao dịch hôm nay</Typography>
                <Typography variant="h1" style={{ color: '#fff', marginVertical: 12 }}>{todayStats.count} Giao dịch</Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ArrowUpRight color="#fff" size={16} />
                  <Typography variant="body2" style={{ color: '#fff' }}>{todayStats.growthText}</Typography>
                </View>
              </Card>

              <Card style={styles.statCard}>
                <Typography variant="subtitle2" color="secondary">Tỷ lệ thanh toán thành công</Typography>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <Typography variant="h1">{successRate}%</Typography>
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
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 250, marginBottom: -16 }}>
              <Input
                placeholder="Tìm nhà tuyển dụng..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Button variant="outline" onPress={() => setIsFilterModalOpen(true)} icon={<Filter size={18} color={colors.textSecondary} />}>Bộ lọc</Button>
            <Button variant="outline" icon={<Download size={18} color={colors.textSecondary} />}>Xuất Excel</Button>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 900, flex: 1 }}>
            <View style={[styles.tableHeader, { backgroundColor: colors.bgSecondary }]}>
              <Typography variant="caption" color="muted" style={styles.colId}>Mã giao dịch</Typography>
              <Typography variant="caption" color="muted" style={styles.colCompany}>Nhà tuyển dụng</Typography>
              <Typography variant="caption" color="muted" style={styles.colPackage}>Gói dịch vụ</Typography>
              <Typography variant="caption" color="muted" style={styles.colAmount}>Số tiền</Typography>
              <Typography variant="caption" color="muted" style={styles.colMethod}>Phương thức</Typography>
              <Typography variant="caption" color="muted" style={styles.colTime}>Thời gian</Typography>
              <Typography variant="caption" color="muted" style={styles.colStatus}>Trạng thái</Typography>
              <Typography variant="caption" color="muted" style={styles.colAction}>Hành động</Typography>
            </View>

            {filteredTransactions.map((item, index) => (
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
                <Typography variant="body2" color="secondary" style={styles.colTime}>{item.time}</Typography>
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
          </View>
        </ScrollView>

        <View style={styles.pagination}>
          <Typography variant="body2" color="secondary">Hiển thị {filteredTransactions.length > 0 ? 1 : 0} - {Math.min(4, filteredTransactions.length)} trên {filteredTransactions.length} giao dịch</Typography>
          <View style={styles.pageNumbers}>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><Typography variant="body2" color="secondary">Trước</Typography></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }]}><Typography variant="body2" style={{ color: '#fff' }}>1</Typography></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><Typography variant="body2">2</Typography></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><Typography variant="body2">3</Typography></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><Typography variant="body2" color="secondary">Sau</Typography></TouchableOpacity>
          </View>
        </View>
      </Card>

      <Modal 
        visible={isFilterModalOpen} 
        title="Bộ lọc nâng cao" 
        onClose={() => setIsFilterModalOpen(false)}
      >
        <Input 
          label="Tên nhà tuyển dụng" 
          placeholder="Ví dụ: Bybit..." 
          value={filterForm.company}
          onChangeText={(t) => setFilterForm({...filterForm, company: t})}
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Input 
              label="Giá trị từ (VNĐ)" 
              placeholder="VD: 100000" 
              value={filterForm.minPrice}
              onChangeText={(t) => setFilterForm({...filterForm, minPrice: t})}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input 
              label="Đến (VNĐ)" 
              placeholder="VD: 500000" 
              value={filterForm.maxPrice}
              onChangeText={(t) => setFilterForm({...filterForm, maxPrice: t})}
            />
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <Button variant="secondary" style={{ flex: 1 }} onPress={handleClearFilter}>Xóa bộ lọc</Button>
          <Button variant="primary" style={{ flex: 1 }} onPress={handleApplyFilter}>Áp dụng</Button>
        </View>
      </Modal>
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
  colTime: { flex: 1.5 },
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
