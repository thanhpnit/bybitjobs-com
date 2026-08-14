import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, useWindowDimensions } from 'react-native';
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
import { db } from '../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/ui/Pagination';

const features = [
  { name: 'Số lượng tin đăng tối đa', starter: '5 tin', pro: '15 tin', premium: '🔥 Không giới hạn' },
  { name: 'Lượt mở khóa CV & SĐT ứng viên', starter: '10 CV', pro: '50 CV', premium: '🔥 Không giới hạn CV' },
  { name: 'Thứ tự ghim bài hiển thị', starter: 'Tiêu chuẩn', pro: '⚡ ƯU TIÊN TOP 2', premium: '👑 ĐỘC QUYỀN TOP 1' },
  { name: 'Huy hiệu phát sáng viền bài', starter: 'Mặc định', pro: '⚡ PRO (Xanh Royal)', premium: '👑 ★ PREMIUM (Vàng Amber)' },
  { name: 'Trợ lý AI HR (Soạn JD & Phỏng vấn)', starter: false, pro: 'Đánh giá AI CV', premium: '👑 Trợ lý AI HR Độc quyền' },
];

const parseFlexibleDate = (raw: any): Date => {
  if (!raw) return new Date();
  if (raw instanceof Date) return isNaN(raw.getTime()) ? new Date() : raw;
  if (typeof raw === 'number') return new Date(raw);
  
  const str = String(raw).trim();
  const dStandard = new Date(str);
  if (!isNaN(dStandard.getTime())) return dStandard;

  const dateMatch = str.match(/(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);
  if (dateMatch) {
    const p1 = Number(dateMatch[1]);
    const p2 = Number(dateMatch[2]);
    const p3 = Number(dateMatch[3]);
    if (p1 > 1000) return new Date(p1, p2 - 1, p3);
    return new Date(p3, p2 - 1, p1);
  }
  return new Date();
};

const formatDateVN = (d: Date): string => {
  if (isNaN(d.getTime())) return '14/08/2026';
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

export const ServicePackages: React.FC = () => {
  const { colors, theme } = useTheme();
  const { packages, setPackages, employers } = useData();
  const navigate = useNavigate();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmProps, setConfirmProps] = useState({ visible: false, title: '', message: '', onConfirm: () => {} });
  const [orders, setOrders] = useState<any[]>([]);
  const [chartFilter, setChartFilter] = useState<'7days' | '30days' | '12months'>('30days');

  useEffect(() => {
    fetch('http://160.250.246.119:4000/api/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(err => console.error('Lỗi tải orders:', err));
  }, []);

  const totalRevenue = React.useMemo(() => {
    const successOrders = orders.filter(o => o.status === 'success' || o.status === 'Completed');
    return successOrders.reduce((sum, o) => sum + Number(o.price || 0), 0);
  }, [orders]);

  const packageRatios = React.useMemo(() => {
    const totalEmp = (employers || []).length;
    if (totalEmp === 0) return { proPct: 0, premPct: 0, freePct: 100 };

    const proEmployers = (employers || []).filter(e => (e.packageId || e.package || '').toLowerCase().includes('pro')).length;
    const premEmployers = (employers || []).filter(e => (e.packageId || e.package || '').toLowerCase().includes('premium')).length;
    const proOrders = orders.filter(o => (o.status === 'success' || o.status === 'Completed') && (o.packageName || o.package || '').toLowerCase().includes('pro')).length;
    const premOrders = orders.filter(o => (o.status === 'success' || o.status === 'Completed') && (o.packageName || o.package || '').toLowerCase().includes('premium')).length;

    const actualPro = Math.max(proEmployers, proOrders);
    const actualPrem = Math.max(premEmployers, premOrders);
    const actualFree = Math.max(0, totalEmp - actualPro - actualPrem);

    const proPct = Math.round((actualPro / totalEmp) * 100);
    const premPct = Math.round((actualPrem / totalEmp) * 100);
    const freePct = Math.max(0, 100 - proPct - premPct);

    return { proPct, premPct, freePct };
  }, [orders, employers]);

  const subscriptionChartData = React.useMemo(() => {
    const now = new Date();
    
    if (chartFilter === '7days') {
      const days = ["CN", "T.2", "T.3", "T.4", "T.5", "T.6", "T.7"];
      const labels: string[] = [];
      const data: number[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);

        labels.push(days[d.getDay()]);
        
        const dayOrders = orders.filter(o => {
          const tDate = new Date(o.createdAt || o.created_at || o.date);
          return tDate >= d && tDate <= dayEnd;
        }).length;
        
        data.push(dayOrders);
      }
      return { labels, data };
    } else if (chartFilter === '12months') {
      const currentYear = now.getFullYear();
      const labels = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
      const data = new Array(12).fill(0);

      orders.forEach(o => {
        const tDate = new Date(o.createdAt || o.created_at || o.date);
        if (!isNaN(tDate.getTime()) && tDate.getFullYear() === currentYear) {
          data[tDate.getMonth()] += 1;
        }
      });
      return { labels, data };
    } else {
      const labels = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
      const data = [0, 0, 0, 0];
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      orders.forEach(o => {
        const tDate = new Date(o.createdAt || o.created_at || o.date);
        if (!isNaN(tDate.getTime()) && tDate >= thirtyDaysAgo) {
          const diffDays = Math.floor((now.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24));
          const weekIdx = 3 - Math.min(3, Math.floor(diffDays / 7));
          data[weekIdx] += 1;
        }
      });
      return { labels, data };
    }
  }, [orders, chartFilter]);

  const getPackageUsers = (pkg: any) => {
    const nameLower = (pkg.name || '').toLowerCase();
    const pkgId = (pkg.id || '').toLowerCase();

    const isVip = pkgId === 'premium' || nameLower.includes('premium') || nameLower.includes('vip');
    const isPro = pkgId === 'pro' || nameLower.includes('pro');
    const isFree = pkgId === 'free' || nameLower.includes('miễn phí') || nameLower.includes('starter');

    if (isVip) {
      return employerSubscriptions.filter(item => item.isVip).length;
    }
    if (isPro) {
      return employerSubscriptions.filter(item => item.isPro).length;
    }
    if (isFree) {
      return employerSubscriptions.filter(item => !item.isVip && !item.isPro).length;
    }

    return employerSubscriptions.filter(item => item.packageName.toLowerCase().includes(pkgId) || item.packageName.toLowerCase().includes(nameLower)).length;
  };

  const employerSubscriptions = React.useMemo(() => {
    const list: any[] = [];
    const processedCompanies = new Set<string>();

    (employers || []).forEach((emp, index) => {
      const companyName = emp.company || emp.company_name || emp.name || `Nhà tuyển dụng #${index + 1}`;
      const email = emp.email || 'ntd@bybitjobs.vn';
      const normCompany = companyName.toLowerCase().trim();
      processedCompanies.add(normCompany);

      const empOrders = (orders || []).filter(o => {
        const isPaid = o.status === 'success' || o.status === 'Completed' || o.status === 'PAID';
        if (!isPaid) return false;
        const oCompany = (o.company || o.employer || '').toLowerCase().trim();
        const oEmail = (o.email || '').toLowerCase().trim();
        return (oCompany.length > 0 && (oCompany.includes(normCompany) || normCompany.includes(oCompany))) ||
               (email.length > 0 && oEmail === email.toLowerCase().trim());
      });

      const latestOrder = empOrders.length > 0 ? empOrders[empOrders.length - 1] : null;

      let rawPkg = (latestOrder ? (latestOrder.packageName || latestOrder.package || latestOrder.packageId) : null) || emp.packageName || emp.package || emp.packageId || emp.tier || 'free';
      if (typeof rawPkg === 'object' && rawPkg !== null) rawPkg = rawPkg.name || rawPkg.id || 'free';

      let pkgStr = String(rawPkg || '').toLowerCase();
      let pkgDisplayName = 'Gói STARTER (Miễn phí)';
      let isVip = false;
      let isPro = false;

      if (pkgStr.includes('premium') || pkgStr.includes('vip') || emp.isVip || emp.isPremium) {
        pkgDisplayName = 'Gói PREMIUM (VIP 👑)';
        isVip = true;
      } else if (pkgStr.includes('pro') || emp.isPro) {
        pkgDisplayName = 'Gói PRO (Phổ Biến ⭐)';
        isPro = true;
      }

      let startD = parseFlexibleDate((latestOrder ? (latestOrder.date || latestOrder.createdAt) : null) || emp.date || emp.createdAt);
      let startDateStr = formatDateVN(startD);
      let expiryDateStr = 'Vĩnh viễn';
      let daysLeft = 999;
      let statusTag = 'Đang hoạt động';

      if (isVip || isPro) {
        const expiryD = new Date(startD);
        expiryD.setDate(startD.getDate() + 30);

        const now = new Date();
        const diffMs = expiryD.getTime() - now.getTime();
        daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        expiryDateStr = formatDateVN(expiryD);

        if (daysLeft < 0) statusTag = 'Đã hết hạn';
        else if (daysLeft <= 5) statusTag = 'Sắp hết hạn';
        else statusTag = 'Đang hoạt động';
      }

      list.push({
        id: emp.id || `sub-${index}`,
        company: companyName,
        email,
        phone: emp.phone || '090 123 4567',
        packageName: pkgDisplayName,
        isVip,
        isPro,
        startDate: startDateStr,
        expiryDate: expiryDateStr,
        daysLeft,
        statusTag
      });
    });

    (orders || []).forEach((o, index) => {
      const isPaid = o.status === 'success' || o.status === 'Completed' || o.status === 'PAID';
      if (!isPaid) return;

      const companyName = o.company || o.employer || 'Doanh nghiệp';
      const normCompany = companyName.toLowerCase().trim();

      if (processedCompanies.has(normCompany)) return;
      processedCompanies.add(normCompany);

      let rawPkg = o.packageName || o.package || o.packageId || 'premium';
      if (typeof rawPkg === 'object' && rawPkg !== null) rawPkg = rawPkg.name || rawPkg.id || 'premium';

      let pkgStr = String(rawPkg || '').toLowerCase();
      let pkgDisplayName = 'Gói PREMIUM (VIP 👑)';
      let isVip = true;
      let isPro = false;

      if (pkgStr.includes('pro') && !pkgStr.includes('premium')) {
        pkgDisplayName = 'Gói PRO (Phổ Biến ⭐)';
        isVip = false;
        isPro = true;
      }

      let startD = parseFlexibleDate(o.date || o.createdAt);
      let startDateStr = formatDateVN(startD);

      const expiryD = new Date(startD);
      expiryD.setDate(startD.getDate() + 30);

      const now = new Date();
      const diffMs = expiryD.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const expiryDateStr = formatDateVN(expiryD);

      let statusTag = 'Đang hoạt động';
      if (daysLeft < 0) statusTag = 'Đã hết hạn';
      else if (daysLeft <= 5) statusTag = 'Sắp hết hạn';

      list.push({
        id: `order-sub-${index}`,
        company: companyName,
        email: o.email || 'hr@campuchia.vn',
        phone: o.phone || '090 999 8888',
        packageName: pkgDisplayName,
        isVip,
        isPro,
        startDate: startDateStr,
        expiryDate: expiryDateStr,
        daysLeft,
        statusTag
      });
    });

    return list;
  }, [employers, orders]);

  const [empSearch, setEmpSearch] = useState('');
  const [selectedPkgFilter, setSelectedPkgFilter] = useState('all');
  const [empPage, setEmpPage] = useState(1);
  const empItemsPerPage = 5;

  const filteredEmpSubscriptions = React.useMemo(() => {
    return employerSubscriptions.filter(item => {
      const matchSearch = item.company.toLowerCase().includes(empSearch.toLowerCase()) || item.email.toLowerCase().includes(empSearch.toLowerCase());
      const matchPkg = selectedPkgFilter === 'all' || 
        (selectedPkgFilter === 'pro' && item.isPro) || 
        (selectedPkgFilter === 'premium' && item.isVip) || 
        (selectedPkgFilter === 'free' && !item.isPro && !item.isVip);
      return matchSearch && matchPkg;
    });
  }, [employerSubscriptions, empSearch, selectedPkgFilter]);

  const paginatedEmpSubs = React.useMemo(() => {
    const startIdx = (empPage - 1) * empItemsPerPage;
    return filteredEmpSubscriptions.slice(startIdx, startIdx + empItemsPerPage);
  }, [filteredEmpSubscriptions, empPage]);

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

  const handleSubmit = async () => {
    let maxPosts = 0;
    if (formData.posts.toLowerCase().includes('không giới hạn')) maxPosts = 9999;
    else maxPosts = parseInt(formData.posts.replace(/[^0-9]/g, ''), 10) || 0;

    let maxCVs = 0;
    if (formData.cvs.toLowerCase().includes('không giới hạn')) maxCVs = 99999;
    else maxCVs = parseInt(formData.cvs.replace(/[^0-9]/g, ''), 10) || 0;

    const dataToSave = { ...formData, maxPosts, maxCVs };

    try {
      const targetId = editingId || `pkg-${Date.now()}`;
      const existingItem = packages.find(i => i.id === targetId) || {};
      const finalPkg = {
        ...existingItem,
        ...dataToSave,
        id: targetId,
      };

      // 1. Lưu trực tiếp vào Firebase Firestore để đồng bộ vĩnh viễn
      await setDoc(doc(db, 'packages', targetId), finalPkg, { merge: true });

      // 2. Cập nhật state Web Admin ngay lập tức
      if (editingId) {
        setPackages(packages.map(i => i.id === editingId ? { ...i, ...finalPkg } : i));
      } else {
        setPackages([...packages, finalPkg]);
      }
    } catch (error) {
      console.error('Lỗi khi lưu gói dịch vụ vào Firebase:', error);
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

      <View style={[styles.pricingCards, isMobile && { flexDirection: 'column' }]}>
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
              <Typography variant="subtitle2" color="brand">{getPackageUsers(pkg)}</Typography>
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
      {/* BẢNG QUẢN LÝ NHÀ TUYỂN DỤNG ĐĂNG KÝ GÓI & THỜI HẠN */}
      <Card style={styles.tableCard}>
        <View style={[styles.filterBar, { flexWrap: 'wrap', gap: 12 }]}>
          <View>
            <Typography variant="h4">Nhà tuyển dụng đã đăng ký gói & Thời hạn hết hạn</Typography>
            <Typography variant="body2" color="secondary" style={{ marginTop: 4 }}>
              Theo dõi danh sách các công ty đang sử dụng gói dịch vụ, ngày đăng ký và thời gian hết hạn.
            </Typography>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Input
              placeholder="Tìm tên công ty, email..."
              value={empSearch}
              onChangeText={setEmpSearch}
              style={{ width: 220, marginBottom: 0 }}
            />
            <View style={{ flexDirection: 'row', backgroundColor: colors.bgPrimary, borderRadius: 8, padding: 3, borderWidth: 1, borderColor: colors.borderLight }}>
              <TouchableOpacity
                onPress={() => { setSelectedPkgFilter('all'); setEmpPage(1); }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: selectedPkgFilter === 'all' ? colors.primaryColor : 'transparent',
                }}
              >
                <Typography variant="caption" style={{ color: selectedPkgFilter === 'all' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                  Tất cả
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setSelectedPkgFilter('pro'); setEmpPage(1); }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: selectedPkgFilter === 'pro' ? colors.primaryColor : 'transparent',
                }}
              >
                <Typography variant="caption" style={{ color: selectedPkgFilter === 'pro' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                  Gói PRO
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setSelectedPkgFilter('premium'); setEmpPage(1); }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: selectedPkgFilter === 'premium' ? colors.primaryColor : 'transparent',
                }}
              >
                <Typography variant="caption" style={{ color: selectedPkgFilter === 'premium' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                  Gói PREMIUM
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setSelectedPkgFilter('free'); setEmpPage(1); }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: selectedPkgFilter === 'free' ? colors.primaryColor : 'transparent',
                }}
              >
                <Typography variant="caption" style={{ color: selectedPkgFilter === 'free' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                  Gói STARTER
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 900 }}>
            <View style={[styles.tableHeader, { borderBottomColor: colors.borderLight }]}>
              <Typography variant="subtitle2" color="secondary" style={{ flex: 2 }}>DOANH NGHIỆP / EMAIL</Typography>
              <Typography variant="subtitle2" color="secondary" style={{ flex: 1.5 }}>GÓI DỊCH VỤ</Typography>
              <Typography variant="subtitle2" color="secondary" style={{ flex: 1.5 }}>NGÀY ĐĂNG KÝ</Typography>
              <Typography variant="subtitle2" color="secondary" style={{ flex: 1.5 }}>NGÀY HẾT HẠN</Typography>
              <Typography variant="subtitle2" color="secondary" style={{ flex: 1.5 }}>TRẠNG THÁI</Typography>
            </View>

            {paginatedEmpSubs.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Typography variant="body2" color="secondary">Không có nhà tuyển dụng nào trong danh sách</Typography>
              </View>
            ) : (
              paginatedEmpSubs.map((emp) => (
                <View key={emp.id} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={{ flex: 2 }}>
                    <Typography variant="subtitle2">{emp.company}</Typography>
                    <Typography variant="caption" color="secondary">{emp.email}</Typography>
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Badge status={emp.isVip ? 'warning' : emp.isPro ? 'brand' : 'default'}>
                      {emp.packageName}
                    </Badge>
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Typography variant="body2">{emp.startDate}</Typography>
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Typography variant="body2" style={{ fontWeight: '600', color: emp.isVip || emp.isPro ? colors.textPrimary : colors.textMuted }}>
                      {emp.expiryDate}
                    </Typography>
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Badge status={emp.statusTag === 'Đang hoạt động' || emp.statusTag === 'Hoạt động' ? 'success' : emp.statusTag === 'Sắp hết hạn' ? 'warning' : 'danger'}>
                      {emp.statusTag === 'Sắp hết hạn' ? `Còn ${emp.daysLeft} ngày` : emp.statusTag === 'Đã hết hạn' ? 'Đã hết hạn' : emp.statusTag}
                    </Badge>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <Pagination
          currentPage={empPage}
          totalPages={Math.ceil(filteredEmpSubscriptions.length / empItemsPerPage) || 1}
          onPageChange={setEmpPage}
          totalItems={filteredEmpSubscriptions.length}
          itemsPerPage={empItemsPerPage}
        />
      </Card>

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
              { 
                name: 'Mức giá', 
                getValue: (pkg: any) => {
                  if (!pkg.price || pkg.price === 'Miễn phí' || pkg.priceNum === 0) return '0 VNĐ';
                  return pkg.price.includes('/') ? pkg.price : `${pkg.price} ${pkg.period || ''}`;
                }
              },
              { name: 'Giới hạn bài đăng', getValue: (pkg: any) => pkg.posts || '5 bài' },
              { name: 'Giới hạn lượt nhận CV', getValue: (pkg: any) => pkg.cvs || '10 CV' },
              { name: 'Gắn nhãn "Nổi bật"', getValue: (pkg: any) => (pkg.name || '').toLowerCase().includes('premium') || (pkg.name || '').toLowerCase().includes('vip') ? 'Không giới hạn' : (pkg.name || '').toLowerCase().includes('pro') ? '5 bài / tháng' : false },
              { name: 'Xuất báo cáo (PDF/CSV)', getValue: (pkg: any) => (pkg.name || '').toLowerCase().includes('free') || (pkg.name || '').toLowerCase().includes('miễn phí') ? false : true },
              { name: 'Hỗ trợ ưu tiên (Live Chat)', getValue: (pkg: any) => (pkg.name || '').toLowerCase().includes('premium') || (pkg.name || '').toLowerCase().includes('vip') ? true : false },
            ].map((feat, index) => (
              <View key={index} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
                <Typography variant="body2" style={styles.colFeature}>{feat.name}</Typography>
                {packages.map(pkg => {
                  const val = feat.getValue(pkg);
                  return (
                    <View key={pkg.id} style={styles.colValue}>
                      {val === true ? <Check color={colors.successText} size={20} /> : val === false ? <X color={colors.textMuted} size={20} /> : <Typography variant="body2" color={(pkg.name || '').toLowerCase().includes('premium') ? 'success' : (pkg.name || '').toLowerCase().includes('pro') ? 'brand' : 'primary'}>{val as string}</Typography>}
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

      <View style={[styles.bottomGrid, isMobile && { flexDirection: 'column' }]}>
        <Card style={styles.chartCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <Typography variant="h4">Đăng ký gói dịch vụ</Typography>
            
            {/* Interactive chart filter tab selector */}
            <View style={{ flexDirection: 'row', backgroundColor: colors.bgPrimary, borderRadius: 8, padding: 3, borderWidth: 1, borderColor: colors.borderLight }}>
              <TouchableOpacity
                onPress={() => setChartFilter('7days')}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: chartFilter === '7days' ? colors.primaryColor : 'transparent',
                }}
              >
                <Typography variant="caption" style={{ color: chartFilter === '7days' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                  7 ngày
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChartFilter('30days')}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: chartFilter === '30days' ? colors.primaryColor : 'transparent',
                }}
              >
                <Typography variant="caption" style={{ color: chartFilter === '30days' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                  30 ngày
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChartFilter('12months')}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: chartFilter === '12months' ? colors.primaryColor : 'transparent',
                }}
              >
                <Typography variant="caption" style={{ color: chartFilter === '12months' ? '#FFF' : colors.textSecondary, fontWeight: '600' }}>
                  12 tháng
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          <MockChart
            type="bar"
            labels={subscriptionChartData.labels}
            data={subscriptionChartData.data}
            height={220}
          />
        </Card>

        <Card style={styles.revenueCard}>
          <View style={[styles.iconWrapperLarge, { backgroundColor: colors.primaryLight }]}>
            <Wallet color={colors.primaryColor} size={32} />
          </View>
          <Typography variant="subtitle1" style={{ marginTop: 16 }}>Doanh thu gói dịch vụ</Typography>
          <Typography variant="h1" color="brand" style={{ marginVertical: 12 }}>{totalRevenue.toLocaleString()} VNĐ</Typography>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Typography variant="caption" color="secondary">Gói Pro</Typography>
              <Typography variant="h4">{packageRatios.proPct}%</Typography>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Typography variant="caption" color="secondary">Gói Premium</Typography>
              <Typography variant="h4">{packageRatios.premPct}%</Typography>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Typography variant="caption" color="secondary">Gói Starter</Typography>
              <Typography variant="h4">{packageRatios.freePct}%</Typography>
            </View>
          </View>

          <Button 
            variant="outline" 
            style={{ marginTop: 24, width: '100%' }}
            onPress={() => navigate('/payments')}
          >
            Xem báo cáo tài chính chi tiết
          </Button>
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
