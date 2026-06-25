import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { db } from '../../src/config/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'expo-router';

interface NotificationItem {
  id: string;
  category: 'job' | 'system' | 'community' | 'security';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
}

const getRelativeTimeLabel = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  return `${diffDays} ngày trước`;
};

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const { 
    userData, 
    notifications, 
    markAllNotificationsAsRead, 
    markNotificationAsRead 
  } = useAuth();

  const [activeSegment, setActiveSegment] = React.useState<'all' | 'unread'>('all');
  const [selectedNotification, setSelectedNotification] = React.useState<any>(null);

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    Alert.alert('Thành công', 'Đã đánh dấu tất cả thông báo là đã đọc!');
  };

  const handleNotificationPress = (id: string) => {
    markNotificationAsRead(id);
    const item = notifications.find((n) => n.id === id);
    if (item) {
      setSelectedNotification(item);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'job':
        return { name: 'briefcase', color: '#0084FF', bg: '#E6F4FE' };
      case 'security':
        return { name: 'shield-checkmark', color: '#4CAF50', bg: '#E8F5E9' };
      case 'community':
        return { name: 'people', color: '#FF2D55', bg: '#FFEBEE' };
      default:
        return { name: 'notifications', color: '#FF9500', bg: '#FFF3E0' };
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeSegment === 'unread') return !n.isRead;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#151718' : '#F4F5F7' }]}>
      {/* Header Background */}
      <View style={styles.headerBg} />
      <SafeAreaView style={styles.safeArea}>

        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerBarPlaceholder} />
          <Text style={styles.headerTitle}>Thông báo</Text>
          {notifications.some((n) => !n.isRead) ? (
            <TouchableOpacity activeOpacity={0.7} onPress={handleMarkAllRead} style={styles.iconButton}>
              <Ionicons name="checkmark-done" size={24} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBarPlaceholder} />
          )}
        </View>

        {/* Filter Segment Row */}
        <View style={styles.segmentContainer}>
          <View style={[styles.segmentTrack, { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSegment('all')}
              style={[
                styles.segmentItem,
                activeSegment === 'all' && [styles.segmentItemActive, { backgroundColor: isDark ? '#2C2C2E' : '#FFF' }]
              ]}
            >
              <Text style={[styles.segmentText, activeSegment === 'all' ? styles.segmentTextActive : { color: isDark ? '#AAA' : '#666' }]}>
                Tất cả ({notifications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSegment('unread')}
              style={[
                styles.segmentItem,
                activeSegment === 'unread' && [styles.segmentItemActive, { backgroundColor: isDark ? '#2C2C2E' : '#FFF' }]
              ]}
            >
              <Text style={[styles.segmentText, activeSegment === 'unread' ? styles.segmentTextActive : { color: isDark ? '#AAA' : '#666' }]}>
                Chưa đọc ({notifications.filter(n => !n.isRead).length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List of Notifications */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {!userData?.uid ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1C1C1E' : '#E6F4FE' }]}>
                <Ionicons name="lock-closed-outline" size={48} color="#0084FF" />
              </View>
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Yêu cầu đăng nhập
              </Text>
              <Text style={styles.emptySubtitle}>
                Vui lòng đăng nhập để xem thông báo cá nhân, tin tức việc làm và các cập nhật mới nhất từ hệ thống.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/login')}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => {
              const iconData = getCategoryIcon(item.category);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => handleNotificationPress(item.id)}
                  style={[
                    styles.notificationCard,
                    isDark ? styles.darkCard : styles.lightCard,
                    !item.isRead && styles.unreadCardBorder
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                    {/* Category Icon Circle */}
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1C1C1E' : iconData.bg }]}>
                      <Ionicons name={iconData.name as any} size={20} color={iconData.color} />
                    </View>

                    {/* Content */}
                    <View style={styles.contentCol}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#11181C', fontWeight: !item.isRead ? 'bold' : '600' }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        {!item.isRead && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                      <Text style={[styles.cardDesc, { color: isDark ? '#AAA' : '#5E6E7A' }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                      <Text style={styles.cardTime}>
                        {item.time}
                      </Text>
                    </View>

                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1C1C1E' : '#E6F4FE' }]}>
                <Ionicons name="notifications-off-outline" size={48} color="#0084FF" />
              </View>
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                Không có thông báo mới
              </Text>
              <Text style={styles.emptySubtitle}>
                Bạn sẽ nhận được thông báo khi có việc làm mới, lời mời phỏng vấn hoặc cập nhật hệ thống.
              </Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Custom Detail Modal */}
        <Modal
          visible={!!selectedNotification}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedNotification(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFF' }]}>
              {selectedNotification && (() => {
                const iconData = getCategoryIcon(selectedNotification.category);
                return (
                  <>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      <View style={[styles.modalIconCircle, { backgroundColor: isDark ? '#2C2C2E' : iconData.bg }]}>
                        <Ionicons name={iconData.name as any} size={28} color={iconData.color} />
                      </View>
                      <View style={styles.modalBadgeContainer}>
                        <Text style={[styles.modalBadgeText, { color: iconData.color, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : iconData.bg }]}>
                          {selectedNotification.category.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Body */}
                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                      <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#11181C' }]}>
                        {selectedNotification.title}
                      </Text>
                      
                      <View style={styles.modalTimeContainer}>
                        <Ionicons name="time-outline" size={14} color="#8E8E93" style={{ marginRight: 4 }} />
                        <Text style={styles.modalTimeText}>
                          {selectedNotification.time}
                        </Text>
                      </View>

                      <View style={[styles.modalDivider, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]} />

                      <Text style={[styles.modalDescription, { color: isDark ? '#E5E5EA' : '#2C2C2E' }]}>
                        {selectedNotification.description}
                      </Text>
                    </ScrollView>

                    {/* Footer Close Button */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedNotification(null)}
                      style={styles.modalCloseButton}
                    >
                      <Text style={styles.modalCloseButtonText}>Đóng</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 120 : 100,
    backgroundColor: '#0084FF',
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerBarPlaceholder: {
    width: 36,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Segment bar styles
  segmentContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  segmentTrack: {
    flexDirection: 'row',
    height: 42,
    borderRadius: 21,
    padding: 3,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentItemActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  segmentTextActive: {
    color: '#0084FF',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Notification cards
  notificationCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  lightCard: {
    backgroundColor: '#FFF',
  },
  darkCard: {
    backgroundColor: '#1C1C1E',
  },
  unreadCardBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#0084FF',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 13,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0084FF',
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  cardTime: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 6,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 100,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 18,
  },
  loginButton: {
    backgroundColor: '#0084FF',
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
    width: '100%',
  },
  loginButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBadgeContainer: {
    borderRadius: 8,
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  modalBody: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 6,
  },
  modalTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTimeText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  modalDivider: {
    height: 1,
    width: '100%',
    marginVertical: 14,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  modalCloseButton: {
    backgroundColor: '#0084FF',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#0084FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modalCloseButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
