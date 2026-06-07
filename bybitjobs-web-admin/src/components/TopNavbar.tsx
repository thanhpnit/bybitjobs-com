import React from 'react';
import { View, TextInput, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { Search, PlusCircle, Bell, HelpCircle, Moon, Sun } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export const TopNavbar: React.FC = () => {
  const { theme, toggleTheme, colors } = useTheme();
  const navigate = useNavigate();

  return (
    <View style={[styles.topNavbar, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.borderColor }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.bgPrimary, borderColor: colors.borderLight }]}>
        <Search color={colors.textMuted} size={18} style={styles.searchIcon} />
        <TextInput 
          placeholder="Tìm kiếm người dùng, công ty..." 
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.textPrimary }]}
        />
      </View>

      <View style={styles.navbarActions}>
        <TouchableOpacity 
          style={[styles.btnPrimary, { backgroundColor: colors.primaryColor }]}
          onPress={() => navigate('/notifications')}
        >
          <PlusCircle color="#FFFFFF" size={18} />
          <Text style={styles.btnPrimaryText}>Tạo thông báo</Text>
        </TouchableOpacity>

        <View style={[styles.iconActions, { borderLeftColor: colors.borderColor, borderRightColor: colors.borderColor }]}>
          <TouchableOpacity style={styles.iconBtn}>
            <Bell color={colors.textSecondary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <HelpCircle color={colors.textSecondary} size={20} />
          </TouchableOpacity>
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
