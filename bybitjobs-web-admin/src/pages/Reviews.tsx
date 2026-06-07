import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { collection, deleteField, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { db } from '../config/firebase';
import {
  Filter,
  Download,
  MessageSquare,
  ClipboardList,
  AlertTriangle,
  Star,
  CheckCircle2,
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';

type ReviewStatus = 'Chờ duyệt' | 'Đã phê duyệt' | 'Bị báo cáo';

interface CompanyReview {
  id: string;
  name: string;
  company: string;
  jobTitle: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  reviewedAt: string;
  appliedAt: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Chưa có thời gian';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Chưa có thời gian';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const Reviews: React.FC = () => {
  const { colors } = useTheme();
  const [data, setData] = useState<CompanyReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'applications'), (snapshot) => {
      const reviews = snapshot.docs
        .map((item) => {
          const value = item.data();
          return {
            id: item.id,
            name: value.applicantName || value.candidateName || 'Người dùng',
            company: value.companyName || 'Nhà tuyển dụng',
            jobTitle: value.jobTitle || 'Công việc đã ứng tuyển',
            rating: Number(value.companyRating || 0),
            comment: value.companyComment || '',
            status: (value.reviewStatus || 'Chờ duyệt') as ReviewStatus,
            reviewedAt: value.reviewedAt || value.appliedAt || '',
            appliedAt: value.appliedAt || '',
          };
        })
        .filter((item) => item.rating > 0 || item.comment.trim().length > 0)
        .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());

      setData(reviews);
      setIsLoading(false);
    }, (error) => {
      console.error('Lỗi tải đánh giá công ty:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = useMemo(() => {
    const total = data.length;
    const pending = data.filter((item) => item.status === 'Chờ duyệt').length;
    const reported = data.filter((item) => item.status === 'Bị báo cáo').length;
    const average = total > 0
      ? data.reduce((sum, item) => sum + item.rating, 0) / total
      : 0;

    return {
      total,
      pending,
      reported,
      average: average.toFixed(1),
    };
  }, [data]);

  const handleApprove = async (id: string) => {
    setData((current) => current.map((item) => item.id === id ? { ...item, status: 'Đã phê duyệt' } : item));
    await updateDoc(doc(db, 'applications', id), { reviewStatus: 'Đã phê duyệt' });
  };

  const handleHide = async (id: string) => {
    setData((current) => current.map((item) => item.id === id ? { ...item, status: 'Bị báo cáo' } : item));
    await updateDoc(doc(db, 'applications', id), { reviewStatus: 'Bị báo cáo' });
  };

  const handleDelete = async (id: string) => {
    setData((current) => current.filter((item) => item.id !== id));
    await updateDoc(doc(db, 'applications', id), {
      companyRating: deleteField(),
      companyComment: deleteField(),
      reviewedAt: deleteField(),
      reviewStatus: deleteField(),
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography variant="h2">Quản lý đánh giá công ty</Typography>
          <Typography variant="body1" color="secondary">
            Hiển thị dữ liệu thật từ người dùng đã đánh giá sau khi ứng tuyển.
          </Typography>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button variant="outline" icon={<Filter size={18} color={colors.textSecondary} />}>Lọc dữ liệu</Button>
          <Button icon={<Download size={18} color="#fff" />}>Xuất báo cáo</Button>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.infoBg }]}><MessageSquare color={colors.infoText} size={20} /></View>
            <Typography variant="subtitle2" color="success">Realtime</Typography>
          </View>
          <Typography variant="subtitle2" color="secondary" style={{ marginTop: 12 }}>TỔNG ĐÁNH GIÁ</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>{stats.total}</Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.warningBg }]}><ClipboardList color={colors.warningText} size={20} /></View>
            <Typography variant="subtitle2" color="secondary">Cần xử lý</Typography>
          </View>
          <Typography variant="subtitle2" color="secondary" style={{ marginTop: 12 }}>CHỜ DUYỆT</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>{stats.pending}</Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.dangerBg }]}><AlertTriangle color={colors.dangerText} size={20} /></View>
            <Typography variant="subtitle2" color="danger">Ưu tiên</Typography>
          </View>
          <Typography variant="subtitle2" color="secondary" style={{ marginTop: 12 }}>BỊ BÁO CÁO</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>{stats.reported}</Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}><Star color={colors.primaryColor} size={20} /></View>
            <Typography variant="subtitle2" color="secondary">Trung bình</Typography>
          </View>
          <Typography variant="subtitle2" color="secondary" style={{ marginTop: 12 }}>ĐIỂM HÀI LÒNG</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>{stats.average}/5</Typography>
        </Card>
      </View>

      <View style={styles.listContainer}>
        {isLoading ? (
          <Card style={styles.emptyCard}>
            <Typography variant="body1" color="secondary">Đang tải đánh giá thật từ người dùng...</Typography>
          </Card>
        ) : data.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Typography variant="subtitle1">Chưa có đánh giá công ty</Typography>
            <Typography variant="body2" color="secondary" style={{ marginTop: 6 }}>
              Khi người dùng đánh giá sao hoặc comment trong app, dữ liệu sẽ xuất hiện tại đây.
            </Typography>
          </Card>
        ) : data.map((item) => (
          <Card key={item.id} style={styles.reviewCard}>
            <View style={styles.reviewContent}>
              <View style={styles.reviewHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={[styles.avatar, { backgroundColor: colors.borderLight }]} />
                  <View>
                    <Typography variant="subtitle1">{item.name}</Typography>
                    <Typography variant="caption" color="secondary">🏢 {item.company}</Typography>
                    <Typography variant="caption" color="secondary">Việc: {item.jobTitle}</Typography>
                  </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} color={i < item.rating ? '#FACC15' : colors.borderLight} fill={i < item.rating ? '#FACC15' : 'transparent'} />
                  ))}
                </View>
              </View>

              <Typography variant="body1" style={{ marginTop: 16, marginBottom: 24, lineHeight: 24 }}>
                {item.comment || 'Người dùng chỉ đánh giá sao, chưa để lại comment.'}
              </Typography>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Badge status={item.status === 'Bị báo cáo' ? 'danger' : item.status === 'Chờ duyệt' ? 'warning' : 'success'}>
                  {item.status === 'Đã phê duyệt' ? '✓ Đã phê duyệt' : item.status === 'Chờ duyệt' ? '⏱ Chờ duyệt' : '⚑ Bị báo cáo'}
                </Badge>
                <Typography variant="body2" color="secondary">
                  {formatDate(item.reviewedAt)} • Application ID: {item.id}
                </Typography>
              </View>
            </View>

            <View style={[styles.actionSidebar, { borderLeftColor: colors.borderLight }]}>
              {item.status !== 'Đã phê duyệt' ? (
                <Button
                  icon={<CheckCircle2 size={16} color="#fff" />}
                  style={{ width: '100%', marginBottom: 12 }}
                  onPress={() => handleApprove(item.id)}
                >Phê duyệt</Button>
              ) : (
                <Button variant="outline" icon={<CheckCircle2 size={16} color={colors.successText || '#10B981'} />} style={{ width: '100%', marginBottom: 12, borderColor: colors.successText || '#10B981' }}>Đã phê duyệt</Button>
              )}
              <Button
                variant="outline"
                icon={<EyeOff size={16} color={colors.textSecondary} />}
                style={{ width: '100%', marginBottom: 12 }}
                onPress={() => handleHide(item.id)}
              >Ẩn đánh giá</Button>
              <Button
                variant="outline"
                icon={<Trash2 size={16} color={colors.dangerColor || '#EF4444'} />}
                style={{ width: '100%', borderColor: 'transparent' }}
                textStyle={{ color: colors.dangerColor || '#EF4444' }}
                onPress={() => handleDelete(item.id)}
              >Xóa đánh giá</Button>
            </View>
          </Card>
        ))}

        <View style={styles.pagination}>
          <Typography variant="body2" color="secondary">Hiển thị {data.length} đánh giá thật</Typography>
          <View style={styles.pageNumbers}>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><ChevronLeft size={16} color={colors.textSecondary} /></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }]}><Typography variant="body2" style={{ color: '#fff' }}>1</Typography></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><ChevronRight size={16} color={colors.textSecondary} /></TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', gap: 24 },
  statCard: { flex: 1 },
  statIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconWrapper: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  listContainer: { gap: 16 },
  emptyCard: { alignItems: 'center', padding: 32 },
  reviewCard: { flexDirection: 'row', padding: 0, overflow: 'hidden' },
  reviewContent: { flex: 3, padding: 32 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  actionSidebar: { flex: 1, padding: 32, borderLeftWidth: 1, justifyContent: 'center' },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 },
  pageNumbers: { flexDirection: 'row', gap: 8 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
