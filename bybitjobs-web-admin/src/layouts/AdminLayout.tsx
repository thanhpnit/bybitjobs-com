import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, TouchableWithoutFeedback } from 'react-native';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';

export const AdminLayout: React.FC = () => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <View style={styles.adminLayout}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isMobile={isMobile} 
      />
      
      {/* Backdrop overlay for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <TouchableWithoutFeedback onPress={() => setIsSidebarOpen(false)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.mainContentWrapper}>
        <TopNavbar 
          onMenuPress={() => setIsSidebarOpen(true)} 
          isMobile={isMobile} 
        />
        <ScrollView 
          style={[styles.mainContent, { backgroundColor: colors.bgPrimary }]}
          contentContainerStyle={[styles.mainContentContainer, isMobile && styles.mainContentContainerMobile]}
        >
          <Outlet />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  adminLayout: {
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 40,
  },
  mainContentWrapper: {
    flex: 1,
    height: '100%',
  },
  mainContent: {
    flex: 1,
  },
  mainContentContainer: {
    padding: 32,
    flexGrow: 1,
  },
  mainContentContainerMobile: {
    padding: 16,
  },
});
