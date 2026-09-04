import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Filter, Download, ArrowUpRight, MoreVertical } from 'lucide-react-native';
import { DatePicker } from '../components/ui/DatePicker';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ModernBarChart } from '../components/ui/ModernBarChart';
import { Pagination } from '../components/ui/Pagination';

import { useData } from '../context/DataContext';
import { buildRevenueChartData, UnifiedTransaction } from '../utils/transactionUtils';

export interface TransactionItem extends UnifiedTransaction {}

export const Payments: React.FC = () => {
  const { colors } = useTheme();
  const { transactions } = useData();
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

  const dateFilteredTransactions = useMemo(() => {
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    return (transactions || []).filter((item) => item.rawDate >= start && item.rawDate <= end);
  }, [transactions, fromDate, toDate]);

  const filteredTransactions = useMemo(() => {
    return dateFilteredTransactions.filter((item) => {
      const matchSearch = item.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.package.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

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

  const totalRevenue = useMemo(() => {
    return (dateFilteredTransactions || [])
      .filter((t) => t.status === 'Completed' || (t as any).statusType === 'success')
      .reduce((sum: number, t) => sum + (t.rawPrice || t.rawAmount || 0), 0);
  }, [dateFilteredTransactions]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [viewMode, setViewMode] = useState<'7days' | '30days' | 'month' | 'custom'>('7days');

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    setViewMode('custom');
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    setViewMode('custom');
  };

  const handleSelect7Days = () => {
    setViewMode('7days');
    const now = new Date();
    const sevenAgo = new Date();
    sevenAgo.setDate(now.getDate() - 6);
    setFromDate(sevenAgo.toISOString().split('T')[0]);
    setToDate(now.toISOString().split('T')[0]);
  };

  const handleSelect30Days = () => {
    setViewMode('30days');
    const now = new Date();
    const thirtyAgo = new Date();
    thirtyAgo.setDate(now.getDate() - 29);
    setFromDate(thirtyAgo.toISOString().split('T')[0]);
    setToDate(now.toISOString().split('T')[0]);
  };

  const handleSelectMonth = () => {
    setViewMode('month');
    const year = new Date().getFullYear();
    setFromDate(`${year}-01-01`);
    setToDate(`${year}-12-31`);
  };

  const chartData = React.useMemo(() => {
    return buildRevenueChartData(transactions || [], viewMode, fromDate, toDate);
  }, [viewMode, transactions, fromDate, toDate]);

  const todayStats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayEnd);
    yesterdayEnd.setDate(todayEnd.getDate() - 1);
    
    const todayCount = transactions.filter((t: TransactionItem) => t.rawDate >= todayStart && t.rawDate <= todayEnd).length;
    const yesterdayCount = transactions.filter((t: TransactionItem) => t.rawDate >= yesterdayStart && t.rawDate <= yesterdayEnd).length;
    
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

  const successRate = useMemo(() => {
    if (dateFilteredTransactions.length === 0) return "0.0";
    const successCount = dateFilteredTransactions.filter((t: TransactionItem) => t.status === 'Completed').length;
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
          onChange={handleFromDateChange} 
          style={{ width: 170 }} 
        />
        <DatePicker 
          label="Đến ngày" 
          value={toDate} 
          onChange={handleToDateChange} 
          style={{ width: 170 }} 
        />
      </View>

      <View style={styles.topGrid}>
            <Card style={styles.chartCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <View>
                  <Typography variant="h3">
                    Biểu đồ doanh thu {viewMode === '7days' ? '7 Ngày (Theo Ngày)' : viewMode === '30days' ? '30 Ngày (Theo Tuần)' : viewMode === 'month' ? '12 Tháng (Năm 2026)' : `Tùy chọn (${fromDate} đến ${toDate})`}
                  </Typography>
                  <Typography variant="body2" color="secondary" style={{ marginTop: 4 }}>
                    Tổng doanh thu: {totalRevenue.toLocaleString()} VNĐ ({chartData.activeRows.length} {viewMode === 'month' ? 'tháng' : viewMode === '30days' ? 'tuần' : 'ngày'} phát sinh)
                  </Typography>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flexDirection: 'row', backgroundColor: colors.bgSecondary, borderRadius: 8, padding: 3, borderWidth: 1, borderColor: colors.borderColor }}>
                    <TouchableOpacity
                      onPress={handleSelect7Days}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        backgroundColor: viewMode === '7days' ? colors.primaryColor : 'transparent',
                      }}
                    >
                      <Typography variant="caption" style={{ color: viewMode === '7days' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                        7 Ngày (Ngày)
                      </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSelect30Days}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        backgroundColor: viewMode === '30days' ? colors.primaryColor : 'transparent',
                      }}
                    >
                      <Typography variant="caption" style={{ color: viewMode === '30days' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                        30 Ngày (Tuần)
                      </Typography>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSelectMonth}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        backgroundColor: viewMode === 'month' ? colors.primaryColor : 'transparent',
                      }}
                    >
                      <Typography variant="caption" style={{ color: viewMode === 'month' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                        Theo Tháng
                      </Typography>
                    </TouchableOpacity>
                  </View>
                  <Badge status={totalRevenue > 0 ? "success" : "default"}>
                    {totalRevenue > 0 ? "Thực tế" : "Chưa có phát sinh"}
                  </Badge>
                </View>
              </View>

              <ModernBarChart data={chartData.allRows} maxRevenue={chartData.maxRev} height={220} />
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

            {filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item: TransactionItem, index: number) => (
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

        <Pagination 
          currentPage={currentPage}
          totalItems={filteredTransactions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          label="giao dịch"
        />
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
          onChangeText={(t: string) => setFilterForm(prev => ({...prev, company: t}))}
        />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Input 
              label="Giá trị từ (VNĐ)" 
              placeholder="VD: 100000" 
              value={filterForm.minPrice}
              onChangeText={(t: string) => setFilterForm(prev => ({...prev, minPrice: t}))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input 
              label="Đến (VNĐ)" 
              placeholder="VD: 500000" 
              value={filterForm.maxPrice}
              onChangeText={(t: string) => setFilterForm(prev => ({...prev, maxPrice: t}))}
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
