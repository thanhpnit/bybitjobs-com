import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, Building2, CheckCircle2, Clock, FileText, ChevronLeft, ChevronRight, Eye } from 'lucide-react-native';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useState } from 'react';

import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useData } from '../context/DataContext';
import { useEffect } from 'react';

export const Employers: React.FC = () => {
  const { colors } = useTheme();
  const [employers, setEmployers] = useState<any[]>([]);
  const apiHost = window.location.hostname;

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchEmployers = async () => {
    try {
      const response = await fetch(`http://${apiHost}:4000/api/employers`);
      if (response.ok) {
        const data = await response.json();
        setEmployers(data);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách NTD:', error);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmProps, setConfirmProps] = useState({ visible: false, title: '', message: '', onConfirm: () => {} });
  
  const [formData, setFormData] = useState({ company: '', industry: '', email: '', phone: '', status: 'Đang hoạt động', postsLimit: '0/10' });

  const handleOpenAdd = () => {
    setFormData({ company: '', industry: '', email: '', phone: '', status: 'Đang hoạt động', postsLimit: '0/10' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ company: item.company, industry: item.industry, email: item.email, phone: item.phone, status: item.status, postsLimit: item.postsLimit });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const requestDelete = (id: string) => {
    setConfirmProps({
      visible: true,
      title: 'Xóa nhà tuyển dụng',
      message: 'Bạn có chắc chắn muốn xóa nhà tuyển dụng này không? Mọi dữ liệu liên quan sẽ bị xóa vĩnh viễn.',
      onConfirm: async () => {
        // Thực tế có thể cần API DELETE, ở đây tạm update state cục bộ (giả định chưa có API delete)
        setEmployers(employers.filter(i => i.id !== id));
      }
    });
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`http://${apiHost}:4000/api/employers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Xác thực' })
      });
      if (response.ok) {
        fetchEmployers();
      }
    } catch (error) {
      console.error('Lỗi duyệt:', error);
    }
  };

  const handleSubmit = () => {
    if (editingId) {
      setEmployers(employers.map(i => i.id === editingId ? { ...i, ...formData } : i));
    } else {
      const newId = `#EM-${Math.floor(1000 + Math.random() * 9000)}`;
      setEmployers([...employers, { id: newId, isVerified: true, ...formData }]);
    }
    setIsModalOpen(false);
  };

  const filteredData = employers.filter(emp => 
    (emp.company || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (emp.phone || '').includes(searchQuery) ||
    (emp.industry || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography variant="h2">Quản lý nhà tuyển dụng</Typography>
          <Typography variant="body1" color="secondary">
            Theo dõi hồ sơ công ty và giới hạn tin tuyển dụng
          </Typography>
        </View>
        <Button icon={<Plus color="#fff" size={18} />} onPress={handleOpenAdd}>
          Thêm nhà tuyển dụng
        </Button>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.infoBg }]}>
            <Building2 color={colors.infoText} size={24} />
          </View>
          <View style={styles.statInfo}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" color="secondary">TỔNG DOANH NGHIỆP</Typography>
              <Typography variant="caption" color="success">~ +12%</Typography>
            </View>
            <Typography variant="h2" style={{ marginTop: 8 }}>1,284</Typography>
          </View>
        </Card>
        
        <Card style={styles.statCard}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.successBg }]}>
            <CheckCircle2 color={colors.successText} size={24} />
          </View>
          <View style={styles.statInfo}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" color="secondary">ĐÃ XÁC THỰC</Typography>
              <Typography variant="caption" color="secondary">88% tỉ lệ</Typography>
            </View>
            <Typography variant="h2" style={{ marginTop: 8 }}>1,130</Typography>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.warningBg }]}>
            <Clock color={colors.warningText} size={24} />
          </View>
          <View style={styles.statInfo}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" color="secondary">ĐANG CHỜ DUYỆT</Typography>
              <Badge status="danger">CẦN XỬ LÝ</Badge>
            </View>
            <Typography variant="h2" style={{ marginTop: 8 }}>42</Typography>
          </View>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.bgPrimary }]}>
            <FileText color={colors.textSecondary} size={24} />
          </View>
          <View style={styles.statInfo}>
            <Typography variant="subtitle2" color="secondary">BÀI ĐĂNG MỚI (30 NGÀY)</Typography>
            <Typography variant="h2" style={{ marginTop: 8 }}>3,492</Typography>
          </View>
        </Card>
      </View>

      <Card style={styles.tableCard}>
        <View style={styles.filterBar}>
          <View style={styles.filterInputs}>
            <View style={[styles.searchBox, { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput 
                placeholder="Tìm kiếm công ty, email, SĐT..." 
                style={[styles.searchInput, { color: colors.textPrimary }]} 
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.inputGroup}>
              <Typography variant="caption" color="secondary" style={styles.label}>Ngành nghề</Typography>
              <View style={[styles.inputWrapper, { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight }]}><Typography variant="body2">Tất cả</Typography></View>
            </View>
            <View style={styles.inputGroup}>
              <Typography variant="caption" color="secondary" style={styles.label}>Cấp độ</Typography>
              <View style={[styles.inputWrapper, { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight }]}><Typography variant="body2">Tất cả</Typography></View>
            </View>
          </View>
          <Button variant="outline" icon={<Filter size={18} color={colors.textSecondary} />}>
            Lọc nâng cao
          </Button>
        </View>

        <View style={[styles.tableHeader, { borderBottomColor: colors.borderLight, borderTopColor: colors.borderLight }]}>
          <Typography variant="caption" color="muted" style={styles.colId}>MÃ NTD</Typography>
          <Typography variant="caption" color="muted" style={styles.colName}>TÊN CÔNG TY / NTD</Typography>
          <Typography variant="caption" color="muted" style={styles.colEmail}>EMAIL & SĐT</Typography>
          <Typography variant="caption" color="muted" style={styles.colPosts}>GIỚI HẠN TIN</Typography>
          <Typography variant="caption" color="muted" style={styles.colStatus}>TRẠNG THÁI</Typography>
          <Typography variant="caption" color="muted" style={styles.colAction}>THAO TÁC</Typography>
        </View>

        {paginatedData.map((item, index) => (
          <View key={item.id} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
            <Typography variant="subtitle2" color="brand" style={styles.colId}>{item.id}</Typography>
            <View style={[styles.colName, styles.flexRow]}>
              <View style={[styles.avatar, { backgroundColor: colors.borderLight }]} />
              <View>
                <Typography variant="subtitle2">{item.company}</Typography>
                <Typography variant="caption" color="secondary">{item.industry}</Typography>
              </View>
            </View>
            <View style={styles.colEmail}>
              <Typography variant="body2" color="secondary">{item.email}</Typography>
              <Typography variant="body2" color="secondary">{item.phone}</Typography>
            </View>
            <View style={styles.colPosts}>
              <View style={[styles.chip, { backgroundColor: colors.bgPrimary }]}><Typography variant="caption">{item.postsLimit} tin</Typography></View>
            </View>
            <View style={styles.colStatus}>
              <Badge status={item.status === 'Xác thực' ? 'success' : 'warning'}>
                {item.status}
              </Badge>
            </View>
            <View style={[styles.colAction, { flexDirection: 'row', gap: 12 }]}>
              {item.status === 'Chờ duyệt' && (
                <TouchableOpacity onPress={() => handleApprove(item.id)} title="Duyệt">
                  <CheckCircle2 size={18} color={colors.successText} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleOpenEdit(item)}>
                <Edit2 size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => requestDelete(item.id)}>
                <Trash2 size={18} color={colors.dangerColor || '#EF4444'} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.pagination}>
          <Typography variant="body2" color="secondary">Hiển thị {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredData.length)} trên {filteredData.length} kết quả</Typography>
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
      <Modal 
        visible={isModalOpen} 
        title={editingId ? "Sửa nhà tuyển dụng" : "Thêm nhà tuyển dụng"} 
        onClose={() => setIsModalOpen(false)}
      >
        <Input 
          label="Tên công ty" 
          placeholder="Nhập tên công ty..." 
          value={formData.company}
          onChangeText={(text) => setFormData({...formData, company: text})}
        />
        <Input 
          label="Lĩnh vực" 
          placeholder="Nhập lĩnh vực (VD: IT, Bán lẻ)..." 
          value={formData.industry}
          onChangeText={(text) => setFormData({...formData, industry: text})}
        />
        <Input 
          label="Email HR" 
          placeholder="Nhập email..." 
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
        />
        <Input 
          label="Số điện thoại" 
          placeholder="Nhập SĐT..." 
          value={formData.phone}
          onChangeText={(text) => setFormData({...formData, phone: text})}
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
  container: { flex: 1, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusTabs: { flexDirection: 'row', gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  tabActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statsGrid: { flexDirection: 'row', gap: 24 },
  statCard: { flex: 1 },
  iconWrapper: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  statInfo: { gap: 4 },
  tableCard: { padding: 0 },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 24 },
  filterInputs: { flexDirection: 'row', gap: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, width: 280, gap: 8 },
  searchInput: { flex: 1, height: '100%', outlineWidth: 0 },
  inputGroup: { width: 200, gap: 8 },
  label: { marginBottom: 4 },
  inputWrapper: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  tableHeader: { flexDirection: 'row', padding: 24, borderBottomWidth: 1, borderTopWidth: 1 },
  tableRow: { flexDirection: 'row', padding: 24, borderBottomWidth: 1, alignItems: 'center' },
  flexRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 8 },
  colId: { flex: 1 },
  colName: { flex: 2 },
  colContact: { flex: 1.5 },
  colEmail: { flex: 2 },
  colPosts: { flex: 1 },
  colStatus: { flex: 1 },
  colAction: { flex: 1.5, gap: 8 },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' },
  iconBtn: { padding: 4 },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24 },
  pageNumbers: { flexDirection: 'row', gap: 8 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pageDots: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }
});
