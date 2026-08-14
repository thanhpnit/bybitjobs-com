import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Plus, Award, CheckCircle2, ChevronLeft, ChevronRight, Edit2, Trash2, Eye, EyeOff, Tag } from 'lucide-react-native';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useData } from '../context/DataContext';

export const Skills: React.FC = () => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  const { skills, setSkills, jobPosts } = useData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmProps, setConfirmProps] = useState({ visible: false, title: '', message: '', onConfirm: () => {} });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form state
  const [formData, setFormData] = useState({ name: '', desc: '', category: 'Công nghệ', status: 'Active' });

  const handleOpenAdd = () => {
    setFormData({ name: '', desc: '', category: 'Công nghệ', status: 'Active' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ name: item.name, desc: item.desc || '', category: item.category || 'Công nghệ', status: item.status || 'Active' });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const requestDelete = (id: string) => {
    setConfirmProps({
      visible: true,
      title: 'Xóa kỹ năng',
      message: 'Bạn có chắc chắn muốn xóa kỹ năng này không? Các bài đăng hoặc CV sử dụng kỹ năng này sẽ bị ảnh hưởng.',
      onConfirm: () => setSkills(skills.filter(i => i.id !== id))
    });
  };

  const requestToggleStatus = (id: string, currentStatus: string) => {
    const isActivating = currentStatus === 'Inactive';
    setConfirmProps({
      visible: true,
      title: isActivating ? 'Hiện kỹ năng' : 'Ẩn kỹ năng',
      message: isActivating ? 'Bạn có chắc chắn muốn hiện kỹ năng này?' : 'Bạn có chắc chắn muốn ẩn kỹ năng này?',
      onConfirm: () => setSkills(skills.map(i => i.id === id ? { ...i, status: isActivating ? 'Active' : 'Inactive' } : i))
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên kỹ năng!');
      return;
    }

    if (editingId) {
      setSkills(skills.map(i => i.id === editingId ? { ...i, ...formData } : i));
    } else {
      const newId = `sk-${Date.now()}`;
      setSkills([...skills, { 
        id: newId, 
        ...formData,
        posts: 0
      }]);
    }
    setIsModalOpen(false);
  };

  const filteredData = skills.filter(i => 
    (i.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.desc || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <View style={styles.container}>
      <View style={[styles.header, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 16 }]}>
        <View>
          <Typography variant="h2">Quản lý kỹ năng</Typography>
          <Typography variant="body1" color="secondary">
            Danh mục các kỹ năng chuyên môn dùng cho tuyển dụng & gợi ý CV ứng viên
          </Typography>
        </View>
        <Button icon={<Plus color="#fff" size={18} />} onPress={handleOpenAdd}>
          Thêm kỹ năng mới
        </Button>
      </View>

      {/* Highlights / Stats */}
      <View style={[styles.statsGrid, isMobile && { flexDirection: 'column' }]}>
        <Card style={styles.statCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.infoBg }]}>
              <Award color={colors.infoText} size={22} />
            </View>
            <Badge status="info">Tổng danh mục</Badge>
          </View>
          <Typography variant="body2" color="secondary">Tổng số kỹ năng</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>{skills.length}</Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.successBg }]}>
              <CheckCircle2 color={colors.successText} size={22} />
            </View>
            <Badge status="success">Hoạt động</Badge>
          </View>
          <Typography variant="body2" color="secondary">Kỹ năng khả dụng</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>
            {skills.filter(s => s.status === 'Active' || !s.status).length}
          </Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.warningBg }]}>
              <Tag color={colors.warningText} size={22} />
            </View>
            <Badge status="warning">Phổ biến</Badge>
          </View>
          <Typography variant="body2" color="secondary">Nhóm danh mục</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>
            {Array.from(new Set(skills.map(s => s.category || 'Công nghệ'))).length}
          </Typography>
        </Card>
      </View>

      {/* Main Table Card */}
      <Card style={styles.tableCard}>
        <View style={[styles.filterBar, isMobile && { flexDirection: 'column', alignItems: 'stretch' }]}>
          <Typography variant="subtitle1">Danh sách kỹ năng</Typography>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgPrimary, borderRadius: 8, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: colors.borderLight }}>
            <TextInput 
              placeholder="Tìm kiếm kỹ năng..." 
              style={{ color: colors.textPrimary, width: isMobile ? '100%' : 240, outlineWidth: 0, height: '100%' }}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 800, flex: 1 }}>
            <View style={[styles.tableHeader, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.borderLight }]}>
              <Typography variant="caption" color="muted" style={styles.colId}>MÃ SKILL</Typography>
              <Typography variant="caption" color="muted" style={styles.colName}>TÊN KỸ NĂNG</Typography>
              <Typography variant="caption" color="muted" style={styles.colCategory}>DANH MỤC</Typography>
              <Typography variant="caption" color="muted" style={styles.colDesc}>MÔ TẢ VÀ ỨNG DỤNG</Typography>
              <Typography variant="caption" color="muted" style={styles.colStatus}>TRẠNG THÁI</Typography>
              <Typography variant="caption" color="muted" style={styles.colAction}>THAO TÁC</Typography>
            </View>

            {paginatedData.map((item) => (
              <View key={item.id} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
                <Typography variant="subtitle2" color="brand" style={styles.colId}>{item.id}</Typography>
                <View style={[styles.colName, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <Typography variant="subtitle2">{item.name}</Typography>
                </View>
                <View style={styles.colCategory}>
                  <Badge status="info">{item.category || 'Công nghệ'}</Badge>
                </View>
                <Typography variant="body2" color="secondary" style={styles.colDesc} numberOfLines={2}>
                  {item.desc || 'Chưa có mô tả'}
                </Typography>
                <View style={styles.colStatus}>
                  <Badge status={item.status === 'Inactive' ? 'default' : 'success'}>
                    {item.status === 'Inactive' ? 'Đã ẩn' : 'Hoạt động'}
                  </Badge>
                </View>
                <View style={[styles.colAction, { flexDirection: 'row', gap: 12 }]}>
                  <TouchableOpacity onPress={() => requestToggleStatus(item.id, item.status)}>
                    {item.status === 'Inactive' ? (
                      <Eye size={18} color={colors.successText || '#10B981'} />
                    ) : (
                      <EyeOff size={18} color={colors.warningText || '#F59E0B'} />
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

        <View style={styles.pagination}>
          <Typography variant="body2" color="secondary">
            Hiển thị {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredData.length)} trên {filteredData.length} kỹ năng
          </Typography>
          <View style={styles.pageNumbers}>
            <TouchableOpacity 
              style={[styles.pageBtn, { borderColor: colors.borderLight }, currentPage === 1 && { opacity: 0.5 }]}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }]}>
              <Typography variant="body2" style={{ color: '#fff' }}>{currentPage}</Typography>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pageBtn, { borderColor: colors.borderLight }, currentPage === totalPages && { opacity: 0.5 }]}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <ChevronRight size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Add / Edit Modal */}
      <Modal 
        visible={isModalOpen} 
        title={editingId ? "Sửa kỹ năng" : "Thêm kỹ năng mới"} 
        onClose={() => setIsModalOpen(false)}
      >
        <Input 
          label="Tên kỹ năng (*)" 
          placeholder="Nhập tên kỹ năng (VD: React Native, Barista)..." 
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
        />
        <Input 
          label="Danh mục kỹ năng" 
          placeholder="Nhập danh mục (VD: Công nghệ, Thiết kế, Bán lẻ)..." 
          value={formData.category}
          onChangeText={(text) => setFormData({...formData, category: text})}
        />
        <Input 
          label="Mô tả kỹ năng" 
          placeholder="Nhập mô tả ngắn về kỹ năng..." 
          value={formData.desc}
          onChangeText={(text) => setFormData({...formData, desc: text})}
        />
        <Button 
          onPress={handleSubmit} 
          style={{ marginTop: 16, width: '100%' }}
        >
          {editingId ? "Cập nhật kỹ năng" : "Tạo mới kỹ năng"}
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
  container: {
    flex: 1,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCard: {
    padding: 0,
    overflow: 'hidden',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  colId: { flex: 1 },
  colName: { flex: 2 },
  colCategory: { flex: 1.5 },
  colDesc: { flex: 3 },
  colStatus: { flex: 1.2 },
  colAction: { flex: 1.2, alignItems: 'center' },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 8,
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
