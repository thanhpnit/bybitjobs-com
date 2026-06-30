import React from 'react';
import { View, TextInput, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { Search, PlusCircle, Bell, HelpCircle, Moon, Sun, Menu } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface TopNavbarProps {
  onMenuPress?: () => void;
  isMobile?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onMenuPress, isMobile = false }) => {
  const { theme, toggleTheme, colors } = useTheme();
  const navigate = useNavigate();

  return (
    <View style={[styles.topNavbar, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.borderColor }, isMobile && styles.topNavbarMobile]}>
      <View style={styles.leftSection}>
        {isMobile && onMenuPress && (
          <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress}>
            <Menu color={colors.textPrimary} size={24} />
          </TouchableOpacity>
        )}
        {!isMobile && (
          <View style={[styles.searchContainer, { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight }]}>
            <Search color={colors.textMuted} size={18} style={styles.searchIcon} />
            <TextInput 
              placeholder="Tìm kiếm người dùng, công ty..." 
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
          </View>
        )}
      </View>

      <View style={styles.navbarActions}>
        {!isMobile && (
          <TouchableOpacity 
            style={[styles.btnPrimary, { backgroundColor: colors.primaryColor }]}
            onPress={() => navigate('/notifications')}
          >
            <PlusCircle color="#FFFFFF" size={18} />
            <Text style={styles.btnPrimaryText}>Tạo thông báo</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.iconActions, { borderLeftColor: colors.borderColor, borderRightColor: colors.borderColor }, isMobile && styles.iconActionsMobile]}>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell color={colors.textSecondary} size={20} />
          </TouchableOpacity>
          {!isMobile && (
            <TouchableOpacity style={styles.iconBtn}>
              <HelpCircle color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
            {theme === 'dark' ? (
              <Sun color={colors.textSecondary} size={20} />
            ) : (
              <Moon color={colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.userProfile}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topNavbar: {
    height: 70,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 5,
  },
  topNavbarMobile: {
    paddingHorizontal: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBtn: {
    marginRight: 16,
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: 320,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter',
    outlineWidth: 0, // for web
  },
  navbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  iconActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 16,
  },
  iconActionsMobile: {
    gap: 4,
    paddingHorizontal: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
