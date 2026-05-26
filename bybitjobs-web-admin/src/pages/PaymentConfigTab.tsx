import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { CreditCard, Smartphone, Trash2, Edit2, QrCode, Eye, UploadCloud, Save } from 'lucide-react-native';

export const PaymentConfigTab: React.FC = () => {
  const { colors } = useTheme();
  const { paymentMethods, setPaymentMethods } = useData();

  const [formData, setFormData] = useState({
    type: 'Chuyển khoản Ngân hàng',
    name: '',
    accountName: '',
    accountNumber: '',
    branch: '',
    status: 'Đang dùng'
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmProps, setConfirmProps] = useState({ visible: false, title: '', message: '', onConfirm: () => {} });

  const handleEdit = (item: any) => {
    setFormData({
      type: item.type,
      name: item.name,
      accountName: item.accountName,
      accountNumber: item.accountNumber,
      branch: item.branch || '',
      status: item.status
    });
    setEditingId(item.id);
  };

  const requestDelete = (id: string) => {
    setConfirmProps({
      visible: true,
      title: 'Xóa phương thức',
      message: 'Bạn có chắc chắn muốn xóa phương thức thanh toán này không?',
      onConfirm: () => setPaymentMethods(paymentMethods.filter(pm => pm.id !== id))
    });
  };

  const handleSave = () => {
    if (editingId) {
      setPaymentMethods(paymentMethods.map(pm => pm.id === editingId ? { ...pm, ...formData } : pm));
      setEditingId(null);
    } else {
      const newId = `pm-${Math.floor(Math.random() * 1000)}`;
      setPaymentMethods([...paymentMethods, { id: newId, ...formData }]);
    }
    setFormData({ type: 'Chuyển khoản Ngân hàng', name: '', accountName: '', accountNumber: '', branch: '', status: 'Đang dùng' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography variant="h2">Quản lý phương thức thanh toán</Typography>
          <Typography variant="body2" color="secondary" style={{ marginTop: 4 }}>
            Thiết lập thông tin tài khoản nhận tiền để hiển thị cho người dùng.
          </Typography>
        </View>
        <Button icon={<Save size={18} color="#fff" />} onPress={handleSave}>
          Lưu cấu hình
        </Button>
      </View>

      <View style={styles.contentGrid}>
        {/* Cột Form */}
        <Card style={styles.formCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
              <CreditCard size={20} color={colors.primaryColor} />
            </View>
            <Typography variant="h3">{editingId ? 'Sửa phương thức' : 'Thêm phương thức mới'}</Typography>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input 
                label="Loại phương thức" 
                placeholder="Ví dụ: Chuyển khoản Ngân hàng" 
                value={formData.type}
                onChangeText={(t) => setFormData({...formData, type: t})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input 
                label="Tên hiển thị" 
                placeholder="VD: Ngân hàng Vietcombank" 
                value={formData.name}
                onChangeText={(t) => setFormData({...formData, name: t})}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input 
                label="Tên chủ tài khoản" 
                placeholder="Viết hoa không dấu" 
                value={formData.accountName}
                onChangeText={(t) => setFormData({...formData, accountName: t})}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input 
                label="Số tài khoản / SĐT" 
                placeholder="Nhập số tài khoản chính xác" 
                value={formData.accountNumber}
                onChangeText={(t) => setFormData({...formData, accountNumber: t})}
              />
            </View>
          </View>

          <Input 
            label="Chi nhánh / Ghi chú (Không bắt buộc)" 
            placeholder="VD: Chi nhánh Nam Sài Gòn" 
            value={formData.branch}
            onChangeText={(t) => setFormData({...formData, branch: t})}
          />

          <View style={{ marginTop: 16 }}>
            <Typography variant="subtitle2" color="secondary" style={{ marginBottom: 8 }}>Mã QR Thanh toán</Typography>
            <View style={[styles.uploadBox, { borderColor: colors.borderLight, backgroundColor: colors.bgSecondary }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primaryLight, marginBottom: 12 }]}>
                <QrCode size={24} color={colors.primaryColor} />
              </View>
              <Typography variant="subtitle1">Kéo thả hoặc nhấp để tải ảnh QR</Typography>
              <Typography variant="caption" color="secondary" style={{ marginTop: 4 }}>Hỗ trợ định dạng PNG, JPG (Tối đa 5MB)</Typography>
            </View>
          </View>
        </Card>

        {/* Cột Danh sách */}
        <View style={styles.listCol}>
          <Card style={{ flex: 1, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Typography variant="subtitle1">Đã thiết lập ({paymentMethods.length})</Typography>
              <Typography variant="subtitle2" color="brand">Xem tất cả</Typography>
            </View>
            
            <ScrollView style={{ flex: 1 }}>
              {paymentMethods.map(pm => (
                <View key={pm.id} style={[styles.pmCard, { borderColor: colors.borderLight }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={[styles.pmIcon, { backgroundColor: colors.bgSecondary }]}>
                        {pm.type.includes('Momo') || pm.type.includes('Ví') ? (
                          <Smartphone size={24} color="#D82D8B" />
                        ) : (
                          <CreditCard size={24} color={colors.primaryColor} />
                        )}
                      </View>
                      <View>
                        <Typography variant="subtitle1">{pm.name}</Typography>
                        <Typography variant="caption" color="secondary">{pm.type.includes('Momo') || pm.type.includes('Ví') ? 'Ví điện tử' : 'NGÂN HÀNG'}</Typography>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.successBg }]}>
                      <Typography variant="caption" color="success" style={{ fontWeight: '600' }}>{pm.status}</Typography>
                    </View>
                  </View>
                  
                  <View style={{ marginBottom: 16 }}>
                    <Typography variant="body2" color="secondary">Chủ TK: <Typography variant="subtitle2" style={{ color: colors.textPrimary }}>{pm.accountName}</Typography></Typography>
                    <Typography variant="body2" color="secondary">Số TK: <Typography variant="subtitle2" style={{ color: colors.textPrimary }}>{pm.accountNumber}</Typography></Typography>
                  </View>
                  
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.bgSecondary, flex: 1 }]} onPress={() => handleEdit(pm)}>
                      <Typography variant="subtitle2">Sửa</Typography>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.dangerBg, width: 48 }]} onPress={() => requestDelete(pm.id)}>
                      <Trash2 size={16} color={colors.dangerColor || '#EF4444'} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Card>

          <Card style={{ marginTop: 24, padding: 20, backgroundColor: colors.bgSecondary }}>
            <Typography variant="subtitle2" style={{ textAlign: 'center', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>
              XEM TRƯỚC MÃ QR HIỆN TẠI
            </Typography>
            <View style={[styles.previewBox, { backgroundColor: colors.bgPrimary }]}>
              {/* Fake QR image placeholder */}
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1629858348873-19bd9910d571?q=80&w=250&auto=format&fit=crop' }} 
                style={{ width: '100%', height: '100%', borderRadius: 8 }}
                resizeMode="cover"
              />
              <View style={[styles.previewEye, { backgroundColor: colors.primaryColor }]}>
                <Eye size={16} color="#fff" />
              </View>
            </View>
          </Card>
        </View>
      </View>

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
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  contentGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  formCol: {
    flex: 2,
    padding: 32,
  },
  listCol: {
    flex: 1.2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pmCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  pmIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionBtn: {
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBox: {
    height: 200,
    borderRadius: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  previewEye: {
    position: 'absolute',
    bottom: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  }
});
