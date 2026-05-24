import React from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function MyJobsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1C1C1E' : '#E6F4FE' }]}>
          <Ionicons name="briefcase" size={48} color="#0084FF" />
        </View>
        <Text style={[styles.title, { color: isDark ? '#FFF' : '#11181C' }]}>Việc của tôi</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9BA1A6' : '#687076' }]}>
          Danh sách các công việc bạn đã ứng tuyển hoặc lưu lại sẽ được hiển thị ở đây.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});
