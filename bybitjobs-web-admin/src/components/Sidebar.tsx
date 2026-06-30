import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Package,
  Briefcase,
  CreditCard,
  AlertOctagon,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  X
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard, path: '/' },
  { id: 'users', label: 'Quản lý người dùng', icon: Users, path: '/users' },
  { id: 'employers', label: 'Quản lý nhà tuyển dụng', icon: Building2, path: '/employers' },
  { id: 'job-posts', label: 'Quản lý bài đăng', icon: FileText, path: '/job-posts' },
  { id: 'packages', label: 'Quản lý gói dịch vụ', icon: Package, path: '/service-packages' },
  { id: 'industries', label: 'Quản lý ngành nghề', icon: Briefcase, path: '/industries' },
  { id: 'payments', label: 'Quản lý thanh toán', icon: CreditCard, path: '/payments' },
  { id: 'reports', label: 'Báo cáo vi phạm', icon: AlertOctagon, path: '/reports' },
  { id: 'reviews', label: 'Đánh giá công ty', icon: MessageSquare, path: '/reviews' },
  { id: 'notifications', label: 'Quản lý thông báo', icon: Bell, path: '/notifications' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, isMobile = false }) => {
  const { colors } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const slideAnim = useRef(new Animated.Value(isMobile ? -260 : 0)).current;

  useEffect(() => {
    if (isMobile) {
      Animated.timing(slideAnim, {
        toValue: isOpen ? 0 : -260,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [isOpen, isMobile, slideAnim]);

  const handleNavPress = (path: string) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const sidebarStyles = [
    styles.sidebar,
    { backgroundColor: colors.bgSecondary, borderRightColor: colors.borderColor },
    isMobile && styles.sidebarMobile,
    isMobile && { transform: [{ translateX: slideAnim }] }
  ];

  return (
    <Animated.View style={sidebarStyles as any}>
      <View style={[styles.sidebarLogo, { borderBottomColor: colors.borderLight }]}>
        <View style={styles.logoWrapper}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primaryColor }]} />
          <View style={styles.logoTextContainer}>
            <Text style={[styles.logoTitle, { color: colors.primaryColor }]}>BybitJobs</Text>
            <Text style={[styles.logoSubtitle, { color: colors.textMuted }]}>HỆ THỐNG QUẢN TRỊ</Text>
          </View>
        </View>
        {isMobile && onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView style={styles.sidebarNav} contentContainerStyle={styles.sidebarNavContent}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.navItem,
                isActive && { backgroundColor: colors.primaryLight }
              ]}
              onPress={() => handleNavPress(item.path)}
            >
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.primaryColor }]} />
              )}
              <item.icon 
                size={20} 
                color={isActive ? colors.primaryColor : colors.textSecondary} 
              />
              <Text style={[
                styles.navLabel,
                { color: isActive ? colors.primaryColor : colors.textSecondary },
                isActive && styles.navLabelActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.sidebarFooter, { borderTopColor: colors.borderLight }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => handleNavPress('/settings')}>
          <Settings size={20} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>Cài đặt hệ thống</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, { marginTop: 4 }]} onPress={logout}>
          <LogOut size={20} color={colors.dangerColor || '#EF4444'} />
          <Text style={[styles.navLabel, { color: colors.dangerColor || '#EF4444' }]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    height: '100%',
    borderRightWidth: 1,
  },
  sidebarMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sidebarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    height: 70,
    borderBottomWidth: 1,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 12,
  },
  logoTextContainer: {
    flexDirection: 'column',
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sidebarNav: {
    flex: 1,
  },
  sidebarNavContent: {
    padding: 16,
    paddingTop: 24,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    left: -16,
    top: 6,
    bottom: 6,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  navLabel: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  navLabelActive: {
    fontWeight: '600',
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
});
