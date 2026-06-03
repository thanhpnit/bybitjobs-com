import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Plus, User, Star, Award, Check, X, Filter, Download, Wallet } from 'lucide-react-native';
import { MockChart } from '../components/ui/MockChart';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useData } from '../context/DataContext';
import * as Icons from 'lucide-react-native';
import { useState } from 'react';
import { db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const features = [
  { name: 'Gắn nhãn "Nổi bật"', starter: false, pro: '5 bài / tháng', premium: 'Không giới hạn' },
  { name: 'Xuất báo cáo ứng viên (PDF/CSV)', starter: false, pro: true, premium: true },
  { name: 'Truy cập database CV', starter: false, pro: 'Giới hạn (100 CV)', premium: 'Full Access' },
  { name: 'Hỗ trợ ưu tiên (Live Chat)', starter: false, pro: false, premium: true },
  { name: 'API Tích hợp hệ thống ATS', starter: false, pro: false, premium: true },
];

export const ServicePackages: React.FC = () => {
  const { colors, theme } = useTheme();
  const { packages, setPackages } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmProps, setConfirmProps] = useState({ visible: false, title: '', message: '', onConfirm: () => {} });

  const [formData, setFormData] = useState({ name: '', price: '', priceNum: 0, period: '/ tháng', posts: '10 bài', cvs: '100 / bài' });

  const handleOpenAdd = () => {
    setFormData({ name: '', price: '', priceNum: 0, period: '/ tháng', posts: '10 bài', cvs: '100 / bài' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setFormData({ name: item.name, price: item.price, priceNum: item.priceNum || 0, period: item.period, posts: item.posts, cvs: item.cvs });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const requestDelete = (id: string) => {
    setConfirmProps({
      visible: true,
      title: 'Xóa gói dịch vụ',
      message: 'Bạn có chắc chắn muốn xóa gói dịch vụ này không? Khách hàng hiện tại có thể bị ảnh hưởng.',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'packages', id));
          setPackages(packages.filter(i => i.id !== id));
        } catch (error) {
          console.error("Lỗi xóa package", error);
        }
      }
    });
  };

  const handleSubmit = () => {
    if (editingId) {
      setPackages(packages.map(i => i.id === editingId ? { ...i, ...formData } : i));
    } else {
      const newId = `pkg-${Math.floor(Math.random() * 1000)}`;
      setPackages([...packages, { 
        id: newId, 
        users: '0', 
        iconName: 'Award', 
        badge: 'MỚI', 
        color: '#10B981', 
        ...formData 
      }]);
    }
    setIsModalOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography variant="h2">Cấu hình Gói Dịch vụ</Typography>
          <Typography variant="body1" color="secondary">
            Điều chỉnh giá, giới hạn và tính năng cho các gói nhà tuyển dụng.
          </Typography>
        </View>
        <Button icon={<Plus color="#fff" size={18} />} onPress={handleOpenAdd}>Thêm gói mới</Button>
      </View>

      <View style={styles.pricingCards}>
        {packages.map((pkg) => {
          const IconComponent = (Icons[pkg.iconName as keyof typeof Icons] as React.ElementType) || Icons.HelpCircle;
          return (
          <Card 
            key={pkg.id} 
            style={[
              styles.pricingCard, 
              pkg.isPopular && { borderColor: colors.primaryColor, borderWidth: 2 }
            ]}
          >
            {pkg.isPopular && (
              <View style={[styles.popularBadge, { backgroundColor: colors.primaryColor }]}>
                <Typography variant="caption" style={{ color: '#fff', fontWeight: 'bold' }}>PHỔ BIẾN NHẤT</Typography>
              </View>
            )}
            
            <View style={styles.pkgHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: pkg.isPopular ? colors.primaryColor : colors.bgPrimary }]}>
                <IconComponent color={pkg.isPopular ? '#fff' : pkg.color} size={24} />
              </View>
              <View style={[styles.badge, { backgroundColor: colors.bgPrimary }]}>
                <Typography variant="caption" style={{ color: pkg.color, fontWeight: '700' }}>{pkg.badge}</Typography>
              </View>
            </View>

            <Typography variant="h3">{pkg.name}</Typography>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginVertical: 8 }}>
              <Typography variant="h2" style={{ color: pkg.isPopular ? colors.primaryColor : colors.textPrimary }}>{pkg.price}</Typography>
              <Typography variant="body2" color="secondary" style={{ marginBottom: 4 }}>{pkg.period}</Typography>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.pkgDetail}>
              <Typography variant="body2" color="secondary">Bài đăng tối đa</Typography>
              <Typography variant="subtitle2">{pkg.posts}</Typography>
            </View>
            <View style={styles.pkgDetail}>
              <Typography variant="body2" color="secondary">Lượt ứng tuyển</Typography>
              <Typography variant="subtitle2">{pkg.cvs}</Typography>
            </View>
            <View style={styles.pkgDetail}>
              <Typography variant="body2" color="secondary">Người dùng hiện tại</Typography>
              <Typography variant="subtitle2" color="brand">{pkg.users}</Typography>
            </View>
            <Button 
              variant={pkg.isPopular ? 'primary' : 'outline'} 
              style={{ marginTop: 24 }}
              onPress={() => handleOpenEdit(pkg)}
            >
              Cập nhật gói
            </Button>
            <Button 
              variant="outline" 
              style={{ marginTop: 8, borderColor: colors.dangerColor || '#EF4444' }}
              onPress={() => requestDelete(pkg.id)}
            >
              <Typography variant="body2" style={{ color: colors.dangerColor || '#EF4444' }}>Xóa gói</Typography>
            </Button>
          </Card>
        )})}
      </View>

      <Card style={styles.tableCard}>
        <View style={styles.filterBar}>
          <Typography variant="h4">So sánh chi tiết tính năng</Typography>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity><Filter size={20} color={colors.textSecondary}/></TouchableOpacity>
            <TouchableOpacity><Download size={20} color={colors.textSecondary}/></TouchableOpacity>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 800 }}>
            <View style={[styles.tableHeader, { borderBottomColor: colors.borderLight }]}>
              <Typography variant="subtitle2" color="secondary" style={styles.colFeature}>TÍNH NĂNG</Typography>
              {packages.map(pkg => (
                <Typography key={pkg.id} variant="subtitle2" color="secondary" style={styles.colValue}>
                  {pkg.name.toUpperCase()}
                </Typography>
              ))}
            </View>

            {[
              { name: 'Mức giá', getValue: (pkg: any) => pkg.price === 'Miễn phí' ? '0 VNĐ' : pkg.price + ' ' + pkg.period },
              { name: 'Giới hạn bài đăng', getValue: (pkg: any) => pkg.posts },
              { name: 'Giới hạn lượt nhận CV', getValue: (pkg: any) => pkg.cvs },
              { name: 'Gắn nhãn "Nổi bật"', getValue: (pkg: any) => pkg.name.toLowerCase().includes('premium') ? 'Không giới hạn' : pkg.name.toLowerCase().includes('pro') ? '5 bài / tháng' : false },
              { name: 'Xuất báo cáo (PDF/CSV)', getValue: (pkg: any) => pkg.name.toLowerCase().includes('starter') ? false : true },
              { name: 'Hỗ trợ ưu tiên (Live Chat)', getValue: (pkg: any) => pkg.name.toLowerCase().includes('premium') ? true : false },
            ].map((feat, index) => (
              <View key={index} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
                <Typography variant="body2" style={styles.colFeature}>{feat.name}</Typography>
                {packages.map(pkg => {
                  const val = feat.getValue(pkg);
                  return (
                    <View key={pkg.id} style={styles.colValue}>
                      {val === true ? <Check color={colors.successText} size={20} /> : val === false ? <X color={colors.textMuted} size={20} /> : <Typography variant="body2" color={pkg.name.toLowerCase().includes('premium') ? 'success' : pkg.name.toLowerCase().includes('pro') ? 'brand' : 'primary'}>{val as string}</Typography>}
                    </View>
                  )
                })}
              </View>
            ))}
            
            <View style={styles.tableFooter}>
              <Typography variant="subtitle2" color="brand">Xem tất cả tính năng</Typography>
            </View>
          </View>
        </ScrollView>
      </Card>

      <View style={styles.bottomGrid}>
        <Card style={styles.chartCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            <Typography variant="h4">Tăng trưởng người dùng</Typography>
            <View style={[styles.chip, { backgroundColor: colors.bgPrimary }]}><Typography variant="body2">30 ngày qua</Typography></View>
          </View>
          <MockChart
            type="bar"
            labels={["T.1", "T.2", "T.3", "T.4", "T.5", "T.6", "T.7"]}
            data={[20, 35, 45, 60, 40, 25, 20]}
            height={220}
          />
        </Card>

        <Card style={styles.revenueCard}>
          <View style={[styles.iconWrapperLarge, { backgroundColor: colors.primaryLight }]}>
            <Wallet color={colors.primaryColor} size={32} />
          </View>
          <Typography variant="subtitle1" style={{ marginTop: 16 }}>Doanh thu dự tính tháng này</Typography>
          <Typography variant="h1" color="brand" style={{ marginVertical: 12 }}>1.450.000.000 VNĐ</Typography>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Typography variant="caption" color="secondary">Gói Pro</Typography>
              <Typography variant="h4">65%</Typography>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Typography variant="caption" color="secondary">Gói Premium</Typography>
              <Typography variant="h4">30%</Typography>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Typography variant="caption" color="secondary">Gói Starter</Typography>
              <Typography variant="h4">5%</Typography>
            </View>
          </View>

          <Button variant="outline" style={{ marginTop: 24, width: '100%' }}>Xem báo cáo tài chính chi tiết</Button>
        </Card>
      </View>

      <Modal 
        visible={isModalOpen} 
        title={editingId ? "Sửa gói dịch vụ" : "Thêm gói dịch vụ"} 
        onClose={() => setIsModalOpen(false)}
      >
        <Input 
          label="Tên gói" 
          placeholder="Nhập tên gói (VD: Enterprise)..." 
          value={formData.name}
          onChangeText={(text) => setFormData({...formData, name: text})}
        />
        <Input 
          label="Mức giá (Hiển thị, VD: 50.000 VNĐ)" 
          placeholder="Nhập mức giá hiển thị..." 
          value={formData.price}
          onChangeText={(text) => setFormData({...formData, price: text})}
        />
        <Input 
          label="Giá tiền thật sự (Số nguyên, VD: 50000)" 
          placeholder="Dùng để thanh toán PayOS..." 
          value={String(formData.priceNum || '')}
          onChangeText={(text) => setFormData({...formData, priceNum: parseInt(text, 10) || 0})}
        />
        <Input 
          label="Giới hạn bài đăng" 
          placeholder="VD: 50 bài, Không giới hạn..." 
          value={formData.posts}
          onChangeText={(text) => setFormData({...formData, posts: text})}
        />
        <Input 
          label="Giới hạn lượt nhận CV" 
          placeholder="VD: 500 CV / bài..." 
          value={formData.cvs}
          onChangeText={(text) => setFormData({...formData, cvs: text})}
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
  pricingCards: { flexDirection: 'row', gap: 24 },
  pricingCard: { flex: 1, position: 'relative' },
  popularBadge: { position: 'absolute', top: -12, alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, zIndex: 1 },
  pkgHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  iconWrapper: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  divider: { height: 1, marginVertical: 16 },
  pkgDetail: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  tableCard: { padding: 0 },
  filterBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, paddingBottom: 16 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1, alignItems: 'center' },
  colFeature: { flex: 2 },
  colValue: { flex: 1, alignItems: 'center' },
  tableFooter: { padding: 24, alignItems: 'center' },
  bottomGrid: { flexDirection: 'row', gap: 24 },
  chartCard: { flex: 1 },
  revenueCard: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  iconWrapperLarge: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }
});
