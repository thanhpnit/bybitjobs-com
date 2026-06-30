import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Plus, Edit2, Ban, ChevronLeft, ChevronRight, RotateCcw, Trash2 } from 'lucide-react-native';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useState } from 'react';

import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useData } from '../context/DataContext';

export const Users: React.FC = () => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { users, setUsers } = useData();

  // Luôn luôn kết nối trực tiếp tới IP VPS thật để vượt qua các bộ chặn cổng (như Cloudflare / Proxy của tên miền)
  const apiHost = '160.250.246.119';

  const searchQuery = '';
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = () => {
    fetch(`http://${apiHost}:4000/api/users`)
      .then(res => res.json())
      .then(data => {
        // Đôi khi API trả về { users: [...] } hoặc [...]
        const usersArray = Array.isArray(data) ? data : data.users;
        if (Array.isArray(usersArray)) {
          setUsers(usersArray);
        }
      })
      .catch(err => console.error('Lỗi tải danh sách người dùng:', err));
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmProps, setConfirmProps] = useState({ visible: false, title: '', message: '', onConfirm: () => {} });
  
  const [formData, setFormData] = useState({ name: '', job: '', email: '', phone: '', status: 'Đã xác thực' });

  const handleOpenAdd = () => {
    setFormData({ name: '', job: '', email: '', phone: '', status: 'Đã xác thực' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ name: item.name, job: item.job, email: item.email, phone: item.phone, status: item.status });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const requestDelete = (id: string) => {
    const isMockUser = id.startsWith('#US-');
    setConfirmProps({
      visible: true,
      title: 'Xóa người dùng',
      message: `Bạn có chắc chắn muốn xóa người dùng này không? ${isMockUser ? 'Người dùng mẫu sẽ bị xóa khỏi bộ nhớ tạm.' : 'Tài khoản này sẽ bị xóa VĨNH VIỄN khỏi Firebase Auth và không thể khôi phục.'}`,
      onConfirm: async () => {
        if (isMockUser) {
          // Xóa mock user khỏi local state & localStorage
          setUsers(users.filter(i => i.id !== id));
          setConfirmProps(prev => ({ ...prev, visible: false }));
          return;
        }

        try {
          const response = await fetch(`http://${apiHost}:4000/api/users/${id}`, {
            method: 'DELETE',
          });
          const result = await response.json();
          if (response.ok) {
            setUsers(users.filter(i => (i.uid || i.id) !== id));
          } else {
            alert(`Lỗi: ${result.error || 'Không thể xóa người dùng'}`);
          }
        } catch (error) {
          console.error('Lỗi khi gọi API xóa người dùng:', error);
          setUsers(users.filter(i => (i.uid || i.id) !== id));
        }
        setConfirmProps(prev => ({ ...prev, visible: false }));
      }
    });
  };

  const requestToggleStatus = (id: string, currentStatus: string) => {
    const isMockUser = id.startsWith('#US-');
    const isBanning = currentStatus !== 'Bị khóa';
    setConfirmProps({
      visible: true,
      title: isBanning ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      message: `Bạn có chắc chắn muốn ${isBanning ? 'khóa' : 'mở khóa'} tài khoản này không?`,
      onConfirm: async () => {
        if (isMockUser) {
          setUsers(users.map(i => i.id === id ? { ...i, status: isBanning ? 'Bị khóa' : 'Đã xác minh' } : i));
          setConfirmProps(prev => ({ ...prev, visible: false }));
          return;
        }

        try {
          const response = await fetch(`http://${apiHost}:4000/api/users/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ disabled: isBanning })
          });
          const result = await response.json();
          if (response.ok) {
            fetchUsers();
          } else {
            alert(`Lỗi: ${result.error || 'Không thể cập nhật trạng thái tài khoản'}`);
          }
        } catch (error) {
          console.error('Lỗi khi gọi API cập nhật trạng thái người dùng:', error);
          setUsers(users.map(i => (i.uid || i.id) === id ? { ...i, status: isBanning ? 'Bị khóa' : 'Đã xác minh' } : i));
        }
        setConfirmProps(prev => ({ ...prev, visible: false }));
      }
    });
  };

  const handleSubmit = () => {
    if (editingId) {
      setUsers(users.map(i => i.id === editingId ? { ...i, ...formData } : i));
    } else {
      const newId = `#US-${Math.floor(1000 + Math.random() * 9000)}`;
      const date = new Date().toLocaleDateString('vi-VN');
      setUsers([...users, { id: newId, date, ...formData }]);
    }
    setIsModalOpen(false);
  };

  const filteredData = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone.includes(searchQuery)
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <View style={styles.container}>
      <View style={[styles.header, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 16 }]}>
        <View>
          <Typography variant="h2">Quản lý người dùng</Typography>
          <Typography variant="body1" color="secondary">
            Quản lý danh sách cá nhân tìm việc trên hệ thống BybitJobs
          </Typography>
        </View>
        <Button icon={<Plus color="#fff" size={18} />} onPress={handleOpenAdd}>
          Tạo tài khoản mới
        </Button>
      </View>

      <View style={[styles.filterSection, isMobile && { flexDirection: 'column' }]}>
        <Card style={styles.filterCard}>
          <Typography variant="subtitle2" style={{ marginBottom: 12 }}>BỘ LỌC TÌM KIẾM</Typography>
          <View style={[styles.filterInputs, isMobile && { flexDirection: 'column' }]}>
            <View style={styles.inputGroup}>
              <Typography variant="caption" color="secondary" style={styles.label}>Trạng thái tài khoản</Typography>
              <View style={[styles.inputWrapper, { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight }]}>
                <Typography variant="body2">Tất cả trạng thái</Typography>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Typography variant="caption" color="secondary" style={styles.label}>Khoảng ngày đăng ký</Typography>
              <View style={[styles.inputWrapper, { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight }]}>
                <Typography variant="body2">mm/dd/yyyy</Typography>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Typography variant="caption" color="secondary" style={styles.label}>{' '}</Typography>
              <Button variant="secondary" style={{ height: 44 }}>Áp dụng bộ lọc</Button>
            </View>
          </View>
        </Card>
        
        <Card style={[styles.statCard, { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }]}>
          <Typography variant="subtitle2" style={{ color: 'rgba(255,255,255,0.8)' }}>TỔNG NGƯỜI TÌM VIỆC</Typography>
          <Typography variant="h1" style={{ color: '#fff', marginVertical: 8 }}>12,840</Typography>
          <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>~ +12% so với tháng trước</Typography>
        </Card>
      </View>

      <Card style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 900, flex: 1 }}>
            <View style={[styles.tableHeader, { borderBottomColor: colors.borderLight }]}>
              <Typography variant="caption" color="muted" style={styles.colId}>MÃ ND</Typography>
              <Typography variant="caption" color="muted" style={styles.colName}>NGƯỜI TÌM VIỆC</Typography>
              <Typography variant="caption" color="muted" style={styles.colContact}>THÔNG TIN LIÊN HỆ</Typography>
              <Typography variant="caption" color="muted" style={styles.colStatus}>TRẠNG THÁI</Typography>
              <Typography variant="caption" color="muted" style={styles.colDate}>NGÀY ĐĂNG KÝ</Typography>
              <Typography variant="caption" color="muted" style={styles.colAction}>THAO TÁC</Typography>
            </View>

            {paginatedData.map((item) => (
              <View key={item.id} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
                <Typography variant="subtitle2" color="brand" style={styles.colId}>
                  {item.id.startsWith('#US-') ? item.id : `#${item.id}`}
                </Typography>
                <View style={[styles.colName, styles.flexRow]}>
                  <View style={[styles.avatar, { backgroundColor: colors.borderLight }]} />
                  <View>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="caption" color="secondary">{item.job}</Typography>
                  </View>
                </View>
                <View style={styles.colContact}>
                  <Typography variant="body2" color="secondary">{item.email}</Typography>
                  <Typography variant="body2" color="secondary">{item.phone}</Typography>
                </View>
                <View style={styles.colStatus}>
                  <Badge status={item.status === 'Đã xác thực' || item.status === 'Đã xác minh' ? 'success' : item.status === 'Bị khóa' ? 'danger' : 'default'}>
                    {item.status}
                  </Badge>
                </View>
                <Typography variant="body2" color="secondary" style={styles.colDate}>{item.date}</Typography>
                <View style={[styles.colAction, styles.flexRow]}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpenEdit(item)}>
                    <Edit2 size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => requestToggleStatus(item.uid || item.id, item.status)}>
                    {item.status === 'Bị khóa' ? (
                      <RotateCcw size={18} color={colors.successText || '#10B981'} />
                    ) : (
                      <Ban size={18} color={colors.warningText || '#F59E0B'} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => requestDelete(item.uid || item.id)}>
                    <Trash2 size={18} color={colors.dangerColor || '#EF4444'} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.pagination, { borderTopColor: colors.borderLight }]}>
          <Typography variant="body2" color="secondary">Hiển thị {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredData.length)} trên tổng số {filteredData.length} người dùng</Typography>
          <View style={styles.pageNumbers}>
            <TouchableOpacity 
              style={[styles.pageBtn, { borderColor: colors.borderLight }, currentPage === 1 && { opacity: 0.5 }]}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.pageBtn, { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }]}>
              <Typography variant="body2" style={{ color: '#fff', fontWeight: '600' }}>{currentPage}</Typography>
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
        title={editingId ? "Sửa tài khoản" : "Tạo tài khoản"} 
        onClose={() => setIsModalOpen(false)}
      >
        <Input 
          label="Họ và tên" 
          placeholder="Nhập họ tên..." 
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
        />
        <Input 
          label="Công việc mong muốn" 
          placeholder="Nhập công việc..." 
          value={formData.job}
          onChangeText={(text) => setFormData({...formData, job: text})}
        />
        <Input 
          label="Email" 
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
          {editingId ? "Cập nhật" : "Lưu tài khoản"}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterSection: { flexDirection: 'row', gap: 24 },
  filterCard: { flex: 3 },
  statCard: { flex: 1, justifyContent: 'center' },
  filterInputs: { flexDirection: 'row', gap: 16 },
  inputGroup: { flex: 1, gap: 8 },
  label: { marginBottom: 4 },
  inputWrapper: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  tableCard: { padding: 0 },
  tableHeader: {
    flexDirection: 'row',
    padding: 24,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 24,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  flexRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  colId: { flex: 1 },
  colName: { flex: 2.5 },
  colContact: { flex: 2 },
  colStatus: { flex: 1.5 },
  colDate: { flex: 1.5 },
  colAction: { flex: 1, gap: 8 },
  iconBtn: { padding: 4 },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
  },
  pageNumbers: { flexDirection: 'row', gap: 8 },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageDots: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
