import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { ArrowRight, AlertTriangle, FileCheck2, Star, Trash2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react-native';
import { db } from '../config/firebase';
import { collection, deleteField, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

interface ApprovedReview {
  id: string;
  name: string;
  company: string;
  jobTitle: string;
  rating: number;
  comment: string;
  date: string;
  reviewedAt: string;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Chưa có thời gian';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Chưa có thời gian';
  return `Đăng ngày ${date.toLocaleDateString('vi-VN')}`;
};

export const Reports: React.FC = () => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  
  const [allReports, setAllReports] = useState<any[]>([]);
  const [reportFilter, setReportFilter] = useState<'pending' | 'accepted' | 'rejected' | 'all'>('pending');
  const [totalReports, setTotalReports] = useState(0);
  const [acceptedReports, setAcceptedReports] = useState(0);
  const [reviewData, setReviewData] = useState<ApprovedReview[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const data = snapshot.docs.map((docSnap: any) => {
        const item = docSnap.data();
        let timeString = 'Vừa xong';
        if (item.createdAt) {
          const date = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
          timeString = date.toLocaleString('vi-VN');
        }
        return {
          id: docSnap.id,
          type: item.type || 'Báo cáo vi phạm',
          time: timeString,
          desc: item.desc || '',
          target: item.target || '',
          targetBy: item.targetBy || '',
          status: item.status || 'pending'
        };
      });
      setAllReports(data);
      setTotalReports(data.length);
      setAcceptedReports(data.filter((r: any) => r.status === 'accepted').length);
    }, (err) => {
      console.error('Lỗi tải danh sách báo cáo:', err);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'applications'), (snapshot) => {
      const approvedReviews = snapshot.docs
        .map((docSnap) => {
          const item = docSnap.data();
          return {
            id: docSnap.id,
            name: item.applicantName || item.candidateName || 'Người dùng',
            company: item.companyName || 'Nhà tuyển dụng',
            jobTitle: item.jobTitle || 'Công việc đã ứng tuyển',
            rating: Number(item.companyRating || 0),
            comment: item.companyComment || '',
            date: formatDate(item.reviewedAt || item.appliedAt),
            reviewedAt: item.reviewedAt || item.appliedAt || '',
            status: item.reviewStatus || 'Chờ duyệt',
          };
        })
        .filter((item) => item.status === 'Đã phê duyệt' && (item.rating > 0 || item.comment.trim().length > 0))
        .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());

      setReviewData(approvedReviews);
    }, (error) => {
      console.error('Lỗi tải đánh giá đã phê duyệt:', error);
    });

    return () => unsubscribe();
  }, []);

  const filteredReports = useMemo(() => {
    if (reportFilter === 'all') return allReports;
    return allReports.filter((r) => r.status === reportFilter);
  }, [allReports, reportFilter]);

  const pendingCount = useMemo(() => allReports.filter(r => r.status === 'pending').length, [allReports]);
  const rejectedCount = useMemo(() => allReports.filter(r => r.status === 'rejected').length, [allReports]);

  const averageRating = reviewData.length > 0
    ? reviewData.reduce((sum, item) => sum + item.rating, 0) / reviewData.length
    : 0;
  const fiveStarRate = reviewData.length > 0
    ? Math.round((reviewData.filter((item) => item.rating === 5).length / reviewData.length) * 100)
    : 0;

  const handleAcceptReport = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reports', id), { status: 'accepted' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectReport = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reports', id), { status: 'rejected' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetReportStatus = async (id: string) => {
    try {
      await updateDoc(doc(db, 'reports', id), { status: 'pending' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reports', id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReview = async (id: string) => {
    setReviewData(reviewData.filter((i) => i.id !== id));
    try {
      await updateDoc(doc(db, 'applications', id), {
        companyRating: deleteField(),
        companyComment: deleteField(),
        reviewedAt: deleteField(),
        reviewStatus: deleteField(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topGrid, isMobile && { flexDirection: 'column' }]}>
        <Card style={styles.statCardMain}>
          <Typography variant="subtitle2" color="secondary">THỐNG KÊ ĐÁNH GIÁ</Typography>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginVertical: 12 }}>
            <Typography variant="h1" style={{ fontSize: 48, color: colors.primaryColor }}>{averageRating.toFixed(1)}</Typography>
            <Typography variant="h3" color="secondary">/ 5.0</Typography>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Typography variant="caption" color="secondary">Tỷ lệ hài lòng (5 sao)</Typography>
            <Typography variant="caption" style={{ fontWeight: '700' }}>{fiveStarRate}%</Typography>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primaryColor, width: `${fiveStarRate}%` }]} />
          </View>
          <Typography variant="caption" color="secondary" style={{ marginTop: 10 }}>
            Dựa trên {reviewData.length} đánh giá đã phê duyệt
          </Typography>
        </Card>

        <Card style={styles.statCardSmall}>
          <View style={[styles.iconBox, { backgroundColor: colors.dangerBg, marginBottom: 16 }]}><AlertTriangle color={colors.dangerText} size={24} /></View>
          <Typography variant="subtitle2" color="secondary">Báo cáo chờ duyệt</Typography>
          <Typography variant="h1" style={{ marginVertical: 8 }}>{pendingCount}</Typography>
          <Typography variant="caption" color="danger">{totalReports} tổng báo cáo | đã duyệt: {acceptedReports}</Typography>
        </Card>

        <Card style={styles.statCardSmall}>
          <View style={[styles.iconBox, { backgroundColor: colors.infoBg, marginBottom: 16 }]}><FileCheck2 color={colors.infoText} size={24} /></View>
          <Typography variant="subtitle2" color="secondary">Đã xử lý / phê duyệt</Typography>
          <Typography variant="h1" style={{ marginVertical: 8 }}>{acceptedReports}</Typography>
          <Typography variant="caption" color="info">{totalReports > 0 ? Math.round((acceptedReports / totalReports) * 100) : 0}% tỷ lệ duyệt</Typography>
        </Card>
      </View>

      <View style={[styles.mainGrid, isMobile && { flexDirection: 'column' }]}>
        <View style={styles.colLeft}>
          <View style={styles.sectionHeader}>
            <Typography variant="h4">Báo cáo & Ý kiến phản hồi</Typography>
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabFilterRow}>
            {[
              { key: 'pending', label: `⏱ Chờ duyệt (${pendingCount})` },
              { key: 'accepted', label: `✓ Đã phê duyệt (${acceptedReports})` },
              { key: 'rejected', label: `✕ Đã bác bỏ (${rejectedCount})` },
              { key: 'all', label: `📋 Tất cả (${totalReports})` },
            ].map((tab) => {
              const isActive = reportFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setReportFilter(tab.key as any)}
                  style={[
                    styles.tabFilterBtn,
                    {
                      backgroundColor: isActive ? colors.primaryColor : colors.borderLight,
                    },
                  ]}
                >
                  <Typography
                    variant="caption"
                    style={{
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    }}
                  >
                    {tab.label}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {filteredReports.length === 0 ? (
            <Card style={[styles.reportCard, { alignItems: 'center', paddingVertical: 40 }]}>
              <FileCheck2 color={colors.infoText} size={40} />
              <Typography variant="subtitle2" color="secondary" style={{ marginTop: 12 }}>
                {reportFilter === 'pending' ? 'Không có báo cáo nào chờ duyệt' : 'Không có dữ liệu phù hợp với bộ lọc'}
              </Typography>
            </Card>
          ) : (
            filteredReports.map((item: any) => (
              <Card key={item.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={[styles.chip, { backgroundColor: item.status === 'accepted' ? '#E8F5E9' : item.status === 'rejected' ? '#FFEBEE' : colors.dangerBg }]}>
                    <Typography
                      variant="caption"
                      style={{
                        fontWeight: '700',
                        color: item.status === 'accepted' ? '#2E7D32' : item.status === 'rejected' ? '#C62828' : colors.dangerText,
                      }}
                    >
                      {item.type} {item.status === 'accepted' ? '(Đã phê duyệt)' : item.status === 'rejected' ? '(Đã bác bỏ)' : ''}
                    </Typography>
                  </View>
                  <Typography variant="caption" color="muted">{item.time}</Typography>
                </View>

                <Typography variant="body1" style={{ fontStyle: 'italic', marginVertical: 16 }}>{item.desc}</Typography>

                <View style={[styles.targetBox, { backgroundColor: colors.bgPrimary }]}>
                  <View style={[styles.targetIcon, { backgroundColor: colors.primaryColor }]} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="subtitle2">{item.target}</Typography>
                    <Typography variant="caption" color="secondary">{item.targetBy}</Typography>
                  </View>
                </View>

                {item.status === 'pending' ? (
                  <View style={styles.actionRow}>
                    <Button style={{ flex: 1 }} onPress={() => handleAcceptReport(item.id)}>Chấp nhận</Button>
                    <Button variant="outline" style={{ flex: 1 }} onPress={() => handleRejectReport(item.id)}>Bác bỏ</Button>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <Button
                      variant="outline"
                      style={{ flex: 1 }}
                      icon={<RotateCcw size={14} color={colors.primaryColor} />}
                      onPress={() => handleResetReportStatus(item.id)}
                    >
                      Hoàn tác
                    </Button>
                    <Button
                      variant="outline"
                      style={{ flex: 1, borderColor: colors.dangerColor || '#EF4444' }}
                      textStyle={{ color: colors.dangerColor || '#EF4444' }}
                      icon={<Trash2 size={14} color={colors.dangerColor || '#EF4444'} />}
                      onPress={() => handleDeleteReport(item.id)}
                    >
                      Xóa
                    </Button>
                  </View>
                )}
              </Card>
            ))
          )}
        </View>

        <View style={styles.colRight}>
          <View style={styles.sectionHeader}>
            <Typography variant="h4">Đánh giá đã phê duyệt</Typography>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Typography variant="subtitle2" color="brand">Xem tất cả</Typography>
              <ArrowRight color={colors.primaryColor} size={16} />
            </TouchableOpacity>
          </View>

          {reviewData.length === 0 ? (
            <Card style={[styles.reviewCard, { alignItems: 'center', paddingVertical: 40 }]}>
              <Star color={colors.textSecondary} size={40} />
              <Typography variant="subtitle2" color="secondary" style={{ marginTop: 12 }}>
                Chưa có đánh giá nào đã được phê duyệt
              </Typography>
            </Card>
          ) : reviewData.map((item) => (
            <Card key={item.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.avatar, { backgroundColor: colors.borderLight }]} />
                  <View>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="caption" color="secondary">Đánh giá cho: {item.company}</Typography>
                    <Typography variant="caption" color="secondary">Việc: {item.jobTitle}</Typography>
                  </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} color={i < item.rating ? '#FACC15' : colors.borderLight} fill={i < item.rating ? '#FACC15' : 'transparent'} />
                  ))}
                </View>
              </View>
              <Typography variant="body2" style={{ marginTop: 16, marginBottom: 24, lineHeight: 22 }}>{item.comment}</Typography>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="muted">{item.date}</Typography>
                <TouchableOpacity onPress={() => handleDeleteReview(item.id)}>
                  <Trash2 color={colors.dangerColor || '#EF4444'} size={20} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 24, paddingBottom: 40 },
  topGrid: { flexDirection: 'row', gap: 24 },
  statCardMain: { flex: 2, justifyContent: 'center' },
  statCardSmall: { flex: 1, justifyContent: 'center' },
  progressBar: { height: 8, borderRadius: 4, width: '100%', overflow: 'hidden' },
  progressFill: { height: '100%' },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mainGrid: { flexDirection: 'row', gap: 24 },
  colLeft: { flex: 1, gap: 16 },
  colRight: { flex: 1, gap: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tabFilterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  tabFilterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  reportCard: { padding: 24 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  targetBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, marginBottom: 24 },
  targetIcon: { width: 40, height: 40, borderRadius: 8 },
  actionRow: { flexDirection: 'row', gap: 12 },
  reviewCard: { padding: 24 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
});
