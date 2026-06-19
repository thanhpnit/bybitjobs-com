import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Plus, Bell, Send, Clock, User, Users as UsersIcon, Building2 } from 'lucide-react-native';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  target: string;
  createdAt: any;
}

export const Notifications: React.FC = () => {
  const { colors } = useTheme();
  
  // Realtime list of notifications from Firestore
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState('ALL'); // 'ALL' | 'UID'
  const [targetUid, setTargetUid] = useState('');

  // Fetch realtime list ordered by createdAt desc
  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: NotificationItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as NotificationItem[];
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications realtime:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenAdd = () => {
    setTitle('');
    setBody('');
    setTargetType('ALL');
    setTargetUid('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!');
      return;
    }

    let target = '';
    if (targetType === 'ALL') {
      target = 'ALL';
    } else if (targetType === 'RECRUITER') {
      target = 'RECRUITER';
    } else if (targetType === 'USER') {
      target = 'USER';
    } else {
      target = targetUid.trim();
      if (!target) {
        alert('Vui lòng nhập UID người nhận!');
        return;
      }
    }

    try {
      // Add record to firestore notifications collection
      await addDoc(collection(db, 'notifications'), {
        title,
        body,
        target,
        createdAt: serverTimestamp()
      });

      // Close modal and reset form
      setIsModalOpen(false);
      setTitle('');
      setBody('');
      setTargetType('ALL');
      setTargetUid('');
    } catch (error) {
      console.error('Lỗi khi lưu thông báo:', error);
      alert('Đã xảy ra lỗi khi tạo thông báo!');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Typography variant="h2">Quản lý thông báo</Typography>
          <Typography variant="body1" color="secondary">
            Gửi thông báo hệ thống và xem lịch sử thông báo đã gửi
          </Typography>
        </View>
        <Button icon={<Plus color="#fff" size={18} />} onPress={handleOpenAdd}>
          Tạo thông báo
        </Button>
      </View>

      {/* Realtime list table card */}
      <Card style={styles.tableCard}>
        <View style={styles.tableHeaderSection}>
          <Typography variant="subtitle1">Lịch sử thông báo</Typography>
        </View>

        <View style={[styles.tableHeader, { borderBottomColor: colors.borderLight, borderTopColor: colors.borderLight }]}>
          <Typography variant="caption" color="muted" style={styles.colTime}>THỜI GIAN</Typography>
          <Typography variant="caption" color="muted" style={styles.colTitle}>TIÊU ĐỀ</Typography>
          <Typography variant="caption" color="muted" style={styles.colBody}>NỘI DUNG CHI TIẾT</Typography>
          <Typography variant="caption" color="muted" style={styles.colTarget}>ĐỐI TƯỢNG</Typography>
        </View>

        <ScrollView style={styles.tableBody}>
          {loading ? (
            <View style={styles.emptyContainer}>
              <Typography variant="body2" color="secondary">Đang tải danh sách thông báo...</Typography>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bell size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
              <Typography variant="body2" color="secondary">Chưa có thông báo nào được gửi.</Typography>
            </View>
          ) : (
            notifications.map((item) => {
              // Safe date check for serverTimestamp latency
              const dateStr = item.createdAt
                ? item.createdAt.toDate().toLocaleString('vi-VN')
                : 'Đang xử lý...';

              return (
                <View key={item.id} style={[styles.tableRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={[styles.colTime, styles.flexRow]}>
                    <Clock size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                    <Typography variant="body2" color="secondary">{dateStr}</Typography>
                  </View>
                  <View style={styles.colTitle}>
                    <Typography variant="subtitle2" style={{ fontWeight: '600' }}>{item.title}</Typography>
                  </View>
                  <View style={styles.colBody}>
                    <Typography variant="body2" color="secondary">{item.body}</Typography>
                  </View>
                  <View style={styles.colTarget}>
                    {item.target === 'ALL' ? (
                      <Badge status="success" style={styles.badgeWidth}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <UsersIcon size={12} color={colors.successText} />
                          <Text style={{ color: colors.successText, fontSize: 11, fontWeight: 'bold' }}>Tất cả (ALL)</Text>
                        </View>
                      </Badge>
                    ) : item.target === 'RECRUITER' ? (
                      <Badge status="warning" style={styles.badgeWidth}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Building2 size={12} color={colors.warningText} />
                          <Text style={{ color: colors.warningText, fontSize: 11, fontWeight: 'bold' }}>Nhà tuyển dụng</Text>
                        </View>
                      </Badge>
                    ) : item.target === 'USER' ? (
                      <Badge status="info" style={styles.badgeWidth}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <User size={12} color={colors.infoText} />
                          <Text style={{ color: colors.infoText, fontSize: 11, fontWeight: 'bold' }}>Người dùng</Text>
                        </View>
                      </Badge>
                    ) : (
                      <Badge status="default" style={styles.badgeWidth}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <User size={12} color={colors.textSecondary} />
                          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: 'bold' }} numberOfLines={1}>
                            UID: {item.target}
                          </Text>
                        </View>
                      </Badge>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </Card>

      {/* Modal Popup creation form */}
      <Modal 
        visible={isModalOpen} 
        title="Tạo thông báo mới" 
        onClose={() => setIsModalOpen(false)}
      >
        <Input 
          label="Tiêu đề thông báo" 
          placeholder="Nhập tiêu đề thông báo..." 
          value={title}
          onChangeText={setTitle}
        />

        <View style={{ marginBottom: 16 }}>
          <Typography variant="subtitle2" style={{ marginBottom: 8 }}>Nội dung thông báo</Typography>
          <TextInput
            style={[
              styles.textarea,
              { 
                backgroundColor: colors.bgSecondary, 
                borderColor: colors.borderLight,
                color: colors.textPrimary 
              }
            ]}
            placeholder="Nhập nội dung chi tiết thông báo..."
            placeholderTextColor={colors.textMuted}
            value={body}
            onChangeText={setBody}
            multiline={true}
            numberOfLines={4}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Typography variant="subtitle2" style={{ marginBottom: 8 }}>Đối tượng nhận thông báo</Typography>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.borderLight,
              backgroundColor: colors.bgSecondary,
              color: colors.textPrimary,
              fontSize: 14,
              fontFamily: 'Inter',
              outline: 'none',
            }}
          >
            <option value="ALL">Gửi tất cả (ALL)</option>
            <option value="RECRUITER">Gửi nhà tuyển dụng</option>
            <option value="USER">Gửi người dùng (Ứng viên)</option>
            <option value="UID">Gửi đích danh (Nhập UID)</option>
          </select>
        </View>

        {targetType === 'UID' && (
          <Input 
            label="UID Người nhận" 
            placeholder="Nhập UID cụ thể..." 
            value={targetUid}
            onChangeText={setTargetUid}
          />
        )}

        <Button 
          onPress={handleSubmit} 
          style={{ marginTop: 16, width: '100%' }}
          icon={<Send color="#fff" size={16} />}
        >
          Xác nhận gửi
        </Button>
      </Modal>
    </View>
  );
};

// Custom standard react-native Text element helper inside badge
const Text: React.FC<{ children: React.ReactNode; style?: any; numberOfLines?: number }> = ({ children, style, numberOfLines }) => {
  return <Typography variant="body2" style={style} numberOfLines={numberOfLines}>{children}</Typography>;
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tableCard: { padding: 0 },
  tableHeaderSection: { padding: 24 },
  tableHeader: { flexDirection: 'row', padding: 24, borderBottomWidth: 1, borderTopWidth: 1 },
  tableBody: { maxHeight: 500 },
  tableRow: { flexDirection: 'row', padding: 24, borderBottomWidth: 1, alignItems: 'center' },
  flexRow: { flexDirection: 'row', alignItems: 'center' },
  colTime: { flex: 1.5 },
  colTitle: { flex: 2, paddingRight: 12 },
  colBody: { flex: 3.5, paddingRight: 12 },
  colTarget: { flex: 2 },
  emptyContainer: { padding: 48, alignItems: 'center', justifyContent: 'center' },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    height: 100,
    textAlignVertical: 'top',
  },
  badgeWidth: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  }
});
