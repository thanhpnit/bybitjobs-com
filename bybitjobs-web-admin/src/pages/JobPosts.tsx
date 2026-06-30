import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Eye, FileText, CheckCircle2, AlertCircle, Ban, Filter, ArrowUpDown, Trash2, CheckSquare, XCircle } from 'lucide-react-native';
import { useState } from 'react';

import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useData } from '../context/DataContext';

export const JobPosts: React.FC = () => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { jobPosts, setJobPosts } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [confirmProps, setConfirmProps] = useState({ visible: false, title: '', message: '', onConfirm: () => {} });
  
  const requestApprove = (id: string) => {
    setConfirmProps({
      visible: true,
      title: 'Duyệt bài đăng',
      message: 'Bạn có chắc chắn muốn duyệt bài đăng này không? Bài đăng sẽ hiển thị ngay lập tức.',
      onConfirm: () => setJobPosts(jobPosts.map(i => i.id === id ? { ...i, status: 'Hoạt động' } : i))
    });
  };

  const requestReject = (id: string) => {
    setConfirmProps({
      visible: true,
      title: 'Từ chối bài đăng',
      message: 'Bạn có chắc chắn muốn từ chối bài đăng này không?',
      onConfirm: () => setJobPosts(jobPosts.map(i => i.id === id ? { ...i, status: 'Bị từ chối' } : i))
    });
  };

  const requestDelete = (id: string) => {
    setConfirmProps({
      visible: true,
      title: 'Xóa bài đăng',
      message: 'Bạn có chắc chắn muốn xóa bài đăng này không? Hành động này không thể hoàn tác.',
      onConfirm: () => setJobPosts(jobPosts.filter(i => i.id !== id))
    });
  };

  const filteredData = jobPosts.filter(job => 
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <View style={styles.container}>
      <View style={[styles.statsGrid, isMobile && { flexDirection: 'column' }]}>
        <Card style={styles.statCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.infoBg }]}><Eye color={colors.infoText} size={20} /></View>
            <View style={[styles.chip, { backgroundColor: colors.infoBg }]}><Typography variant="caption" color="info">+12%</Typography></View>
          </View>
          <Typography variant="body2" color="secondary">Tổng số bài đăng</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>{jobPosts.length}</Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.warningBg }]}><FileText color={colors.warningText} size={20} /></View>
            <Badge status="warning">Cần xử lý</Badge>
          </View>
          <Typography variant="body2" color="secondary">Chờ duyệt</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>{jobPosts.filter(j => j.status === 'Chờ duyệt').length}</Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.dangerBg }]}><Ban color={colors.dangerText} size={20} /></View>
          </View>
          <Typography variant="body2" color="secondary">Bị từ chối</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>{jobPosts.filter(j => j.status === 'Bị từ chối').length}</Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.bgPrimary }]}><FileText color={colors.textSecondary} size={20} /></View>
          </View>
          <Typography variant="body2" color="secondary">Tổng bài đăng</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>1,341</Typography>
        </Card>
      </View>

      <Card style={styles.tableCard}>
        <View style={[styles.filterBar, isMobile && { flexDirection: 'column', alignItems: 'stretch' }]}>
          <View style={[isMobile ? { flexDirection: 'column', gap: 12 } : { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
            <Typography variant="subtitle1">Danh sách bài đăng</Typography>
            <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgPrimary, borderRadius: 8, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: colors.borderLight }]}>
              <TextInput 
                placeholder="Tìm kiếm tiêu đề, công ty..." 
                style={{ color: colors.textPrimary, width: isMobile ? '100%' : 200, outlineWidth: 0, height: '100%' }}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={[styles.statusTabs, { backgroundColor: colors.bgPrimary }]}>
              <TouchableOpacity style={styles.tab}><Typography variant="body2" color="secondary">Tất cả</Typography></TouchableOpacity>
              <TouchableOpacity style={[styles.tab, { backgroundColor: colors.primaryColor, borderRadius: 16 }]}><Typography variant="body2" style={{ color: '#fff' }}>Chờ duyệt</Typography></TouchableOpacity>
            </View>
          </View>
          
          <View style={[{ flexDirection: 'row', gap: 12 }, isMobile && { marginTop: 12 }]}>
            <Button variant="outline" icon={<Filter size={16} color={colors.textSecondary} />} size="sm">Bộ lọc</Button>
            <Button variant="outline" icon={<ArrowUpDown size={16} color={colors.textSecondary} />} size="sm">Sắp xếp</Button>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 1000, flex: 1 }}>
            <View style={[styles.tableHeader, { borderBottomColor: colors.borderLight }]}>
              <Typography variant="caption" color="muted" style={styles.colId}>ID</Typography>
              <Typography variant="caption" color="muted" style={styles.colTitle}>Bài tuyển dụng</Typography>
              <Typography variant="caption" color="muted" style={styles.colCompany}>Nhà tuyển dụng</Typography>
              <Typography variant="caption" color="muted" style={styles.colDate}>Ngày tạo</Typography>
              <Typography variant="caption" color="muted" style={styles.colStatus}>Trạng thái</Typography>
              <Typography variant="caption" color="muted" style={styles.colAction}>Hành động</Typography>
            </View>

            {paginatedData.map((item, index) => (
              <View key={item.id} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
                <Typography variant="subtitle2" color="secondary" style={styles.colId}>{item.id}</Typography>
                <View style={styles.colTitle}>
                  <Typography variant="subtitle2">{item.title}</Typography>
                  <Typography variant="caption" color="secondary">{item.type}</Typography>
                </View>
                <View style={[styles.colCompany, { flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
                  <View style={[styles.avatar, { backgroundColor: colors.borderLight }]} />
                  <View>
                    <Typography variant="subtitle2">{item.company}</Typography>
                    {item.companyStatus === 'Đối tác tin cậy' ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} color={colors.primaryColor} />
                        <Typography variant="caption" color="brand">{item.companyStatus}</Typography>
                      </View>
                    ) : (
                      <Typography variant="caption" color="secondary">{item.companyStatus}</Typography>
                    )}
                  </View>
                </View>
                <Typography variant="body2" color="secondary" style={styles.colDate}>{item.date}</Typography>
                <View style={styles.colStatus}>
                  <Badge status={item.status === 'Hoạt động' ? 'info' : item.status === 'Chờ duyệt' ? 'warning' : 'danger'}>
                    {item.status}
                  </Badge>
                </View>
                <View style={[styles.colAction, { flexDirection: 'row', gap: 12, alignItems: 'center' }]}>
                  {item.status === 'Chờ duyệt' ? (
                    <>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => requestApprove(item.id)}>
                        <CheckCircle2 size={20} color={colors.primaryColor}/>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => requestReject(item.id)}>
                        <XCircle size={20} color={colors.dangerColor || '#EF4444'}/>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity style={styles.iconBtn} disabled>
                      <CheckSquare size={20} color={colors.borderLight}/>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.iconBtn} onPress={() => requestDelete(item.id)}>
                    <Trash2 size={20} color={colors.dangerColor || '#EF4444'} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
          <Typography variant="body2" color="secondary">
            Hiển thị {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredData.length)} trên tổng số {filteredData.length} bài đăng
          </Typography>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity 
              style={[{ padding: 8, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 6 }, currentPage === 1 && { opacity: 0.5 }]}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <Typography variant="body2" color="secondary">Trước</Typography>
            </TouchableOpacity>

            <TouchableOpacity style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.primaryColor, borderRadius: 6 }}>
              <Typography variant="body2" style={{ color: '#fff', fontWeight: '600' }}>{currentPage}</Typography>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[{ padding: 8, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 6 }, currentPage === totalPages && { opacity: 0.5 }]}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <Typography variant="body2" color="secondary">Sau</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      <ConfirmModal 
        visible={confirmProps.visible}
        title={confirmProps.title}
        message={confirmProps.message}
        onConfirm={confirmProps.onConfirm}
        onClose={() => setConfirmProps({ ...confirmProps, visible: false })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 24 },
  statsGrid: { flexDirection: 'row', gap: 24 },
  statCard: { flex: 1 },
  iconWrapper: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  tableCard: { padding: 0 },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  statusTabs: { flexDirection: 'row', padding: 4, borderRadius: 20 },
  tab: { paddingHorizontal: 16, paddingVertical: 6 },
  tableHeader: { flexDirection: 'row', padding: 24, borderBottomWidth: 1 },
  tableRow: { flexDirection: 'row', padding: 24, borderBottomWidth: 1, alignItems: 'center' },
  colId: { flex: 0.8 },
  colTitle: { flex: 3 },
  colCompany: { flex: 2.5 },
  colDate: { flex: 1.2 },
  colStatus: { flex: 1.5 },
  colAction: { flex: 1.5 },
  avatar: { width: 32, height: 32, borderRadius: 8 },
  iconBtn: { padding: 4 },
});
