import React from 'react';
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
import { Swipeable } from 'react-native-gesture-handler';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const router = useRouter();
  
  const { 
    userData, 
    notifications, 
    markAllNotificationsAsRead, 
    markNotificationAsRead,
    deleteNotification,
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
        return { name: 'briefcase', color: '#0F172A', bg: '#F1F5F9' };
      case 'security':
        return { name: 'shield-checkmark', color: '#10B981', bg: '#ECFDF5' };
      case 'community':
        return { name: 'people', color: '#EC4899', bg: '#FDF2F8' };
      default:
        return { name: 'notifications', color: '#F59E0B', bg: '#FEF3C7' };
    }
  };

  const handleDeleteNotification = (id: string) => {
    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
    deleteNotification(id);
  };

  const renderDeleteAction = (id: string) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleDeleteNotification(id)}
      style={styles.deleteAction}
    >
      <Ionicons name="trash-outline" size={22} color="#FFF" />
      <Text style={styles.deleteActionText}>Xóa</Text>
    </TouchableOpacity>
  );

  const filteredNotifications = notifications.filter((n) => {
    if (activeSegment === 'unread') return !n.isRead;
    return true;
  });

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Top Header Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerBarPlaceholder} />
          <Text style={styles.headerTitle}>Thông báo</Text>
          {notifications.some((n) => !n.isRead) ? (
            <TouchableOpacity activeOpacity={0.7} onPress={handleMarkAllRead} style={styles.iconButton}>
              <Ionicons name="checkmark-done" size={22} color="#0F172A" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBarPlaceholder} />
          )}
        </View>

        {/* Filter Segment Row */}
        <View style={styles.segmentContainer}>
          <View style={styles.segmentTrack}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSegment('all')}
              style={[
                styles.segmentItem,
                activeSegment === 'all' && styles.segmentItemActive
              ]}
            >
              <Text style={[styles.segmentText, activeSegment === 'all' ? styles.segmentTextActive : styles.segmentTextInactive]}>
                Tất cả ({notifications.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveSegment('unread')}
              style={[
                styles.segmentItem,
                activeSegment === 'unread' && styles.segmentItemActive
              ]}
            >
              <Text style={[styles.segmentText, activeSegment === 'unread' ? styles.segmentTextActive : styles.segmentTextInactive]}>
                Chưa đọc ({notifications.filter(n => !n.isRead).length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List of Notifications */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {!userData?.uid ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="lock-closed-outline" size={44} color="#0F172A" />
              </View>
              <Text style={styles.emptyTitle}>
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
                <Swipeable
                  key={item.id}
                  renderRightActions={() => renderDeleteAction(item.id)}
                  overshootRight={false}
                >
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleNotificationPress(item.id)}
                    style={[
                      styles.notificationCard,
                      !item.isRead ? styles.unreadCard : styles.readCard
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                      {/* Category Icon Circle */}
                      <View style={[styles.iconCircle, { backgroundColor: iconData.bg }]}>
                        <Ionicons name={iconData.name as any} size={20} color={iconData.color} />
                      </View>

                      {/* Content */}
                      <View style={styles.contentCol}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleUnread]} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {!item.isRead && (
                            <View style={styles.unreadDot} />
                          )}
                        </View>
                        <Text style={styles.cardDesc} numberOfLines={2}>
                          {item.description}
                        </Text>
                        <Text style={styles.cardTime}>
                          {item.time}
                        </Text>
                      </View>

                    </View>
                  </TouchableOpacity>
                </Swipeable>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={44} color="#0F172A" />
              </View>
              <Text style={styles.emptyTitle}>
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
            <View style={styles.modalContent}>
              {selectedNotification && (() => {
                const iconData = getCategoryIcon(selectedNotification.category);
                return (
                  <>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                      <View style={[styles.modalIconCircle, { backgroundColor: iconData.bg }]}>
                        <Ionicons name={iconData.name as any} size={26} color={iconData.color} />
                      </View>
                      <View style={styles.modalBadgeContainer}>
                        <Text style={[styles.modalBadgeText, { color: iconData.color, backgroundColor: iconData.bg }]}>
                          {selectedNotification.category.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Body */}
                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                      <Text style={styles.modalTitle}>
                        {selectedNotification.title}
                      </Text>
                      
                      <View style={styles.modalTimeContainer}>
                        <Ionicons name="time-outline" size={14} color="#94A3B8" style={{ marginRight: 4 }} />
                        <Text style={styles.modalTimeText}>
                          {selectedNotification.time}
                        </Text>
                      </View>

                      <View style={styles.modalDivider} />

                      <Text style={styles.modalDescription}>
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
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerBarPlaceholder: {
    width: 36,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Segment bar styles
  segmentContainer: {
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
  },
  segmentTrack: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 22,
    padding: 4,
    backgroundColor: '#F1F5F9',
  },
  segmentItem: {
    flex: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  segmentTextInactive: {
    color: '#64748B',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Notification cards
  notificationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1.5,
  },
  unreadCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#0F172A',
  },
  readCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
  },
  deleteAction: {
    width: 80,
    minHeight: 76,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contentCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  cardTitleUnread: {
    fontWeight: '700',
    color: '#0F172A',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F172A',
    marginLeft: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    lineHeight: 18,
  },
  cardTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 6,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#0F172A',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#FFFFFF',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBadgeContainer: {
    borderRadius: 8,
  },
  modalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
    marginBottom: 8,
  },
  modalTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTimeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  modalDivider: {
    height: 1,
    width: '100%',
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
    fontWeight: '400',
  },
  modalCloseButton: {
    backgroundColor: '#0F172A',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

