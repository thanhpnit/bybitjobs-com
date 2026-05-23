import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';

export const AdminLayout: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.adminLayout}>
      <Sidebar />
      <View style={styles.mainContentWrapper}>
        <TopNavbar />
        <ScrollView 
          style={[styles.mainContent, { backgroundColor: colors.bgPrimary }]}
          contentContainerStyle={styles.mainContentContainer}
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
});
