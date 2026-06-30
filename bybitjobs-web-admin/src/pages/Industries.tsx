import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Plus, LayoutGrid, Flame, FileText, CheckCircle2, ChevronLeft, ChevronRight, Lightbulb, Edit2, Trash2, Eye, EyeOff } from 'lucide-react-native';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useState } from 'react';

import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useData } from '../context/DataContext';

export const Industries: React.FC = () => {
  const { colors } = useTheme();
  
  const { industries, setIndustries } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmProps, setConfirmProps] = useState({ visible: false, title: '', message: '', onConfirm: () => {} });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form state
  const [formData, setFormData] = useState({ name: '', desc: '', posts: '0', status: 'Active' });

  const handleOpenAdd = () => {
    setFormData({ name: '', desc: '', posts: '0', status: 'Active' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ name: item.name, desc: item.desc, posts: item.posts, status: item.status });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const requestDelete = (id: string) => {
    setConfirmProps({
      visible: true,
      title: 'Xóa ngành nghề',
      message: 'Bạn có chắc chắn muốn xóa ngành nghề này không? Các công việc liên quan sẽ mất danh mục.',
      onConfirm: () => setIndustries(industries.filter(i => i.id !== id))
    });
  };

  const requestToggleStatus = (id: string, currentStatus: string) => {
    const isActivating = currentStatus === 'Inactive';
    setConfirmProps({
      visible: true,
      title: isActivating ? 'Hiện ngành nghề' : 'Ẩn ngành nghề',
      message: isActivating ? 'Bạn có chắc chắn muốn hiện ngành nghề này?' : 'Bạn có chắc chắn muốn ẩn ngành nghề này?',
      onConfirm: () => setIndustries(industries.map(i => i.id === id ? { ...i, status: isActivating ? 'Active' : 'Inactive' } : i))
    });
  };

  const handleSubmit = () => {
    if (editingId) {
      setIndustries(industries.map(i => i.id === editingId ? { ...i, ...formData } : i));
    } else {
      const newId = `0${industries.length + 1}`.slice(-2);
      setIndustries([...industries, { 
        id: newId, 
        ...formData, 
        iconColor: '#0066FF', 
        iconBg: '#E6F0FF' 
      }]);
    }
    setIsModalOpen(false);
  };

  const filteredData = industries.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography variant="h2">Quản lý ngành nghề</Typography>
          <Typography variant="body1" color="secondary">
            Quản lý và thiết lập danh mục công việc trên hệ thống BybitJobs.
          </Typography>
        </View>
        <Button icon={<Plus color="#fff" size={18} />} onPress={handleOpenAdd}>Thêm ngành mới</Button>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Typography variant="subtitle2" color="secondary">TỔNG SỐ NGÀNH</Typography>
            <View style={[styles.iconWrapper, { backgroundColor: colors.infoBg }]}><LayoutGrid color={colors.infoText} size={20} /></View>
          </View>
            <Typography variant="h2" style={{ marginTop: 8 }}>{industries.length}</Typography>
          <Typography variant="caption" color="brand" style={{ marginTop: 4 }}>~ +2 ngành mới tháng này</Typography>
        </Card>
        
        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Typography variant="subtitle2" color="secondary">NGÀNH HOT NHẤT</Typography>
            <View style={[styles.iconWrapper, { backgroundColor: colors.dangerBg }]}><Flame color={colors.dangerText} size={20} /></View>
          </View>
          <Typography variant="h2" style={{ marginTop: 8 }}>Giao hàng</Typography>
          <Typography variant="caption" color="secondary" style={{ marginTop: 4 }}>1,240 bài đăng</Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Typography variant="subtitle2" color="secondary">TỔNG BÀI ĐĂNG</Typography>
            <View style={[styles.iconWrapper, { backgroundColor: colors.warningBg }]}><FileText color={colors.warningText} size={20} /></View>
          </View>
          <Typography variant="h2" style={{ marginTop: 8 }}>5,829</Typography>
          <Typography variant="caption" color="warning" style={{ marginTop: 4 }}>Tăng 12% so với kỳ trước</Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Typography variant="subtitle2" color="secondary">TRẠNG THÁI HỆ THỐNG</Typography>
            <View style={[styles.iconWrapper, { backgroundColor: colors.successBg }]}><CheckCircle2 color={colors.successText} size={20} /></View>
          </View>
          <Typography variant="h2" style={{ marginTop: 8 }}>Ổn định</Typography>
          <Typography variant="caption" color="success" style={{ marginTop: 4 }}>Cập nhật 2 phút trước</Typography>
        </Card>
      </View>

      <Card style={styles.tableCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 40, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 8, paddingHorizontal: 16, width: 300, backgroundColor: colors.bgPrimary }}>
            <TextInput 
              placeholder="Tìm kiếm ngành nghề..." 
              style={{ flex: 1, color: colors.textPrimary, outlineWidth: 0, height: '100%' }}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 800, flex: 1 }}>
            <View style={[styles.tableHeader, { backgroundColor: colors.bgSecondary }]}>
              <Typography variant="caption" color="muted" style={styles.colId}>#</Typography>
              <Typography variant="caption" color="muted" style={styles.colName}>TÊN NGÀNH NGHỀ</Typography>
              <Typography variant="caption" color="muted" style={styles.colPosts}>SỐ BÀI ĐĂNG</Typography>
              <Typography variant="caption" color="muted" style={styles.colStatus}>TRẠNG THÁI</Typography>
              <Typography variant="caption" color="muted" style={styles.colAction}>THAO TÁC</Typography>
            </View>

            {paginatedData.map((item, index) => (
              <View key={item.id} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
                <Typography variant="body2" color="secondary" style={styles.colId}>{item.id}</Typography>
                <View style={[styles.colName, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
                  <View style={[styles.industryIcon, { backgroundColor: item.iconBg }]} />
                  <View>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="caption" color="secondary">{item.desc}</Typography>
                  </View>
                </View>
                <View style={styles.colPosts}>
                  <View style={[styles.chip, { backgroundColor: colors.bgPrimary }]}><Typography variant="subtitle2">{item.posts}</Typography></View>
                </View>
                <View style={styles.colStatus}>
                  <Badge status={item.status === 'Active' ? 'success' : 'default'}>
                    {item.status === 'Active' ? '• Hoạt động' : '• Tạm ẩn'}
                  </Badge>
                </View>
                <View style={[styles.colAction, { flexDirection: 'row', gap: 12 }]}>
                  <TouchableOpacity onPress={() => requestToggleStatus(item.id, item.status)}>
                    {item.status === 'Active' ? (
                      <Eye size={18} color={colors.textSecondary} />
                    ) : (
                      <EyeOff size={18} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleOpenEdit(item)}>
                    <Edit2 size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => requestDelete(item.id)}>
                    <Trash2 size={18} color={colors.dangerColor || '#EF4444'} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
          <Typography variant="body2" color="secondary">
            Hiển thị {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredData.length)} trên tổng số {filteredData.length} kết quả
          </Typography>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity 
              style={[{ padding: 8, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 6 }, currentPage === 1 && { opacity: 0.5 }]}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.primaryColor, borderRadius: 6 }}>
              <Typography variant="body2" style={{ color: '#fff' }}>{currentPage}</Typography>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[{ padding: 8, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 6 }, currentPage === totalPages && { opacity: 0.5 }]}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      <View style={[styles.tipBanner, { backgroundColor: colors.infoBg, borderColor: colors.primaryColor }]}>
        <View style={[styles.tipIcon, { backgroundColor: colors.primaryColor }]}>
          <Lightbulb color="#fff" size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="subtitle2" color="brand" style={{ marginBottom: 4 }}>Mẹo quản trị</Typography>
          <Typography variant="body2" color="secondary">
            Bạn nên thường xuyên kiểm tra các ngành nghề có ít bài đăng để xem xét có cần gộp các danh mục hoặc triển khai các chiến dịch marketing cho ngành đó. Hiện tại, "Gia sư & Dạy kèm" đang có xu hướng giảm nhẹ bài đăng.
          </Typography>
        </View>
      </View>

      <Modal 
        visible={isModalOpen} 
        title={editingId ? "Sửa ngành nghề" : "Thêm ngành nghề"} 
        onClose={() => setIsModalOpen(false)}
      >
        <Input 
          label="Tên ngành nghề" 
          placeholder="Nhập tên ngành..." 
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
        />
        <Input 
          label="Mô tả" 
          placeholder="Nhập mô tả..." 
          value={formData.desc}
          onChangeText={(text) => setFormData({...formData, desc: text})}
        />
        <Button 
          onPress={handleSubmit} 
          style={{ marginTop: 16, width: '100%' }}
        >
          {editingId ? "Cập nhật" : "Tạo mới"}
        </Button>
      </Modal>

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
  container: { flex: 1, gap: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', gap: 24 },
  statCard: { flex: 1 },
  statIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconWrapper: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tableCard: { padding: 0 },
  tableHeader: { flexDirection: 'row', padding: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  tableRow: { flexDirection: 'row', padding: 24, borderBottomWidth: 1, alignItems: 'center' },
  colId: { flex: 0.5 },
  colName: { flex: 3 },
  colPosts: { flex: 1.5 },
  colStatus: { flex: 1.5 },
  colAction: { flex: 1 },
  industryIcon: { width: 48, height: 48, borderRadius: 12 },
  chip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  pageNumbers: { flexDirection: 'row', gap: 8 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tipBanner: { flexDirection: 'row', padding: 24, borderRadius: 16, borderWidth: 1, gap: 16, alignItems: 'center' },
  tipIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }
});
