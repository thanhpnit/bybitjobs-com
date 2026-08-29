import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Plus, Edit2, Ban, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react-native';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useState } from 'react';

import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useData } from '../context/DataContext';
import { db } from '../config/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { Pagination } from '../components/ui/Pagination';

const getItemTime = (item: any) => {
  const value = item?.createdAt || item?.created_at || item?.date || item?.updatedAt || item?.updated_at;
  if (!value) return 0;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && typeof value.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'object' && typeof value._seconds === 'number') return value._seconds * 1000;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    if (value.includes('/')) {
      const parts = value.split(' ')[0].split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        return new Date(year, month - 1, day).getTime();
      }
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const Users: React.FC = () => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { users, setUsers } = useData();

  // Luôn luôn kết nối trực tiếp tới IP VPS thật để vượt qua các bộ chặn cổng (như Cloudflare / Proxy của tên miền)
  const apiHost = import.meta.env.VITE_API_URL || 'http://160.250.246.119:4000';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = () => {
    fetch(`${apiHost}/api/users`)
      .then(res => res.json())
      .then(data => {
        // Đôi khi API trả về { users: [...] } hoặc [...]
        const usersArray = Array.isArray(data) ? data : data.users;
        if (Array.isArray(usersArray)) {
          setUsers([...usersArray].sort((a, b) => getItemTime(b) - getItemTime(a)));
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
  const requestToggleStatus = (id: string, currentStatus: string) => {
    const user = users.find(u => u.id === id || u.uid === id);
    const targetUid = user?.uid || user?.id || id;
    const isBlockedOrDisabled = currentStatus === 'Bị khóa' || currentStatus === 'Tự vô hiệu hóa';
    const isBanning = !isBlockedOrDisabled;

    setConfirmProps({
      visible: true,
      title: isBanning ? 'Khóa tài khoản' : 'Khôi phục tài khoản',
      message: `Bạn có chắc chắn muốn ${isBanning ? 'khóa' : 'khôi phục'} tài khoản này không?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`${apiHost}/api/users/${targetUid}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ disabled: isBanning })
          });
          const result = await response.json();
          if (response.ok) {
            fetchUsers();
            try {
              await addDoc(collection(db, 'notifications'), {
                title: isBanning ? '⚠️ Tài khoản bị tạm khóa' : '✅ Tài khoản đã được khôi phục',
                body: isBanning 
                  ? 'Tài khoản ứng viên của bạn đã bị Admin tạm khóa do vi phạm chính sách.' 
                  : 'Tài khoản ứng viên của bạn đã được Admin khôi phục hoạt động bình thường.',
                category: 'system',
                target: targetUid,
                role: 'candidate',
                createdAt: new Date().toISOString(),
              });
            } catch (notifErr) {
              console.error('Lỗi tạo thông báo khóa/mở user:', notifErr);
            }
          } else {
            alert(`Lỗi: ${result.error || 'Không thể cập nhật trạng thái tài khoản'}`);
          }
        } catch (error) {
          console.error('Lỗi khi gọi API cập nhật trạng thái người dùng:', error);
          setUsers(users.map(i => (i.uid || i.id) === targetUid ? { ...i, status: isBanning ? 'Bị khóa' : 'Đã xác minh' } : i));
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
      setUsers([{ id: newId, date, createdAt: new Date().toISOString(), ...formData }, ...users]);
    }
    setIsModalOpen(false);
  };

  const filteredData = users.filter(user => {
    const nameStr = user.name || '';
    const emailStr = user.email || '';
    const phoneStr = user.phone || '';
    const jobStr = user.job || '';

    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
      emailStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phoneStr.includes(searchQuery) ||
      jobStr.toLowerCase().includes(searchQuery.toLowerCase());
    
    const userStatus = user.status || 'Đã xác minh';
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'verified' && (userStatus === 'Đã xác thực' || userStatus === 'Đã xác minh' || userStatus === 'Hoạt động')) ||
      (statusFilter === 'pending' && userStatus === 'Chờ xác thực') ||
      (statusFilter === 'blocked' && (userStatus === 'Bị khóa' || userStatus === 'Tự vô hiệu hóa'));

    return matchesSearch && matchesStatus;
  }).sort((a, b) => getItemTime(b) - getItemTime(a));

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCSV = () => {
    const headers = ['Mã ND', 'Họ tên', 'Công việc / Chức danh', 'Email', 'Số điện thoại', 'Trạng thái', 'Ngày đăng ký'];
    const rows = filteredData.map((u, index) => [
      u.id || `ND-${index + 1}`,
      u.name || '',
      u.job || '',
      u.email || '',
      u.phone || '',
      u.status || 'Đã xác minh',
      u.date || u.createdAt || ''
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh_sach_nguoi_dung_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 16 }]}>
        <View>
          <Typography variant="h2">Quản lý người dùng</Typography>
          <Typography variant="body1" color="secondary">
            Quản lý danh sách cá nhân tìm việc trên hệ thống BybitJobs
          </Typography>
        </View>
        <Button variant="outline" onPress={exportCSV}>Xuất danh sách CSV</Button>
      </View>

      <View style={[styles.filterSection, isMobile && { flexDirection: 'column' }]}>
        <Card style={styles.filterCard}>
          <Typography variant="subtitle2" style={{ marginBottom: 12 }}>BỘ LỌC & TÌM KIẾM NGƯỜI DÙNG</Typography>
          <View style={[styles.filterInputs, isMobile && { flexDirection: 'column' }]}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Typography variant="caption" color="secondary" style={styles.label}>Từ khóa tìm kiếm</Typography>
              <TextInput
                placeholder="Nhập tên, email, sĐT, công việc..."
                value={searchQuery}
                onChangeText={(text) => { setSearchQuery(text); setCurrentPage(1); }}
                style={{
                  height: 42,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  paddingHorizontal: 12,
                  color: colors.textPrimary,
                  backgroundColor: colors.bgPrimary,
                }}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 3 }]}>
              <Typography variant="caption" color="secondary" style={styles.label}>Lọc theo trạng thái</Typography>
              <View style={{ flexDirection: 'row', backgroundColor: colors.bgPrimary, borderRadius: 8, padding: 3, borderWidth: 1, borderColor: colors.borderLight }}>
                <TouchableOpacity
                  onPress={() => { setStatusFilter('all'); setCurrentPage(1); }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: statusFilter === 'all' ? colors.primaryColor : 'transparent',
                  }}
                >
                  <Typography variant="caption" style={{ color: statusFilter === 'all' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                    Tất cả
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setStatusFilter('verified'); setCurrentPage(1); }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: statusFilter === 'verified' ? colors.primaryColor : 'transparent',
                  }}
                >
                  <Typography variant="caption" style={{ color: statusFilter === 'verified' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                    Đã xác minh
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setStatusFilter('pending'); setCurrentPage(1); }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: statusFilter === 'pending' ? colors.primaryColor : 'transparent',
                  }}
                >
                  <Typography variant="caption" style={{ color: statusFilter === 'pending' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                    Chờ xác thực
                  </Typography>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setStatusFilter('blocked'); setCurrentPage(1); }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: statusFilter === 'blocked' ? colors.primaryColor : 'transparent',
                  }}
                >
                  <Typography variant="caption" style={{ color: statusFilter === 'blocked' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                    Bị khóa
                  </Typography>
                </TouchableOpacity>
              </View>
            </View>

            {(searchQuery !== '' || statusFilter !== 'all') && (
              <View style={styles.inputGroup}>
                <Typography variant="caption" color="secondary" style={styles.label}>{' '}</Typography>
                <Button variant="secondary" style={{ height: 42 }} onPress={() => { setSearchQuery(''); setStatusFilter('all'); setCurrentPage(1); }}>
                  Xóa lọc
                </Button>
              </View>
            )}
          </View>
        </Card>
        
        <Card style={[styles.statCard, { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }]}>
          <Typography variant="subtitle2" style={{ color: 'rgba(255,255,255,0.8)' }}>TỔNG NGƯỜI TÌM VIỆC</Typography>
          <Typography variant="h1" style={{ color: '#fff', marginVertical: 8 }}>{users.length}</Typography>
          <Typography variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>~ Dữ liệu thực tế</Typography>
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

            {paginatedData.map((item, index) => {
              const stt = (currentPage - 1) * itemsPerPage + index + 1;
              const displayId = item.id.startsWith('#US-') ? item.id : `#ND-${String(stt).padStart(3, '0')}`;
              return (
                <View key={item.id} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
                  <Typography variant="subtitle2" color="brand" style={styles.colId}>
                    {displayId}
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
                  <Badge status={item.status === 'Đã xác thực' || item.status === 'Đã xác minh' ? 'success' : item.status === 'Bị khóa' ? 'danger' : item.status === 'Tự vô hiệu hóa' ? 'warning' : 'default'}>
                    {item.status}
                  </Badge>
                </View>
                <Typography variant="body2" color="secondary" style={styles.colDate}>{item.date}</Typography>
                <View style={[styles.colAction, styles.flexRow]}>
                  <TouchableOpacity onPress={() => requestToggleStatus(item.uid || item.id, item.status)}>
                    {item.status === 'Bị khóa' || item.status === 'Tự vô hiệu hóa' ? (
                      <RotateCcw size={18} color={colors.successText || '#10B981'} />
                    ) : (
                      <Ban size={18} color={colors.warningText || '#F59E0B'} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          </View>
        </ScrollView>

        <Pagination 
          currentPage={currentPage}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          label="người dùng"
        />
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
