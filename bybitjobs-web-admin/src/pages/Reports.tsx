import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { ArrowRight, AlertTriangle, FileCheck2, MoreVertical, Star, Trash2 } from 'lucide-react-native';
import { useState } from 'react';

const reports = [
  { id: 1, type: 'Nội dung không phù hợp', time: '10 phút trước', desc: '"Mô tả bài đăng chứa các liên kết lừa đảo và hình ảnh nhạy cảm không liên quan đến công việc."', target: 'Lập trình viên React Native', targetBy: 'Người đăng: TechCorp JSC' },
  { id: 2, type: 'Thông tin sai lệch', time: '2 giờ trước', desc: '"Lương thực tế thấp hơn nhiều so với mô tả trong bài đăng."', target: 'Nhân viên Marketing Online', targetBy: 'Người đăng: Global Trade Ltd' },
];

const reviews = [
  { id: 1, name: 'Nguyễn Văn A', company: 'Đánh giá cho: FPT Software', rating: 5, comment: 'Môi trường làm việc chuyên nghiệp, đồng nghiệp thân thiện. Chế độ đãi ngộ rất tốt cho sinh viên mới ra trường.', date: 'Đăng ngày 12/10/2023' },
  { id: 2, name: 'Trần Thị B', company: 'Đánh giá cho: Viettel Group', rating: 4, comment: 'Công việc khá áp lực nhưng bù lại lương thưởng xứng đáng. Cần cải thiện quy trình làm việc nội bộ.', date: 'Đăng ngày 11/10/2023' },
  { id: 3, name: 'Lê Văn C', company: 'Đánh giá cho: VinGroup', rating: 5, comment: 'Địa điểm làm việc hơi xa trung tâm, nhưng cơ sở vật chất hiện đại bậc nhất.', date: 'Đăng ngày 10/10/2023' },
];

export const Reports: React.FC = () => {
  const { colors } = useTheme();
  
  const [reportData, setReportData] = useState(reports);
  const [reviewData, setReviewData] = useState(reviews);

  const handleAcceptReport = (id: number) => {
    setReportData(reportData.filter(i => i.id !== id));
  };

  const handleRejectReport = (id: number) => {
    setReportData(reportData.filter(i => i.id !== id));
  };

  const handleDeleteReview = (id: number) => {
    setReviewData(reviewData.filter(i => i.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.topGrid}>
        <Card style={styles.statCardMain}>
          <Typography variant="subtitle2" color="secondary">THỐNG KÊ ĐÁNH GIÁ</Typography>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginVertical: 12 }}>
            <Typography variant="h1" style={{ fontSize: 48, color: colors.primaryColor }}>4.8</Typography>
            <Typography variant="h3" color="secondary">/ 5.0</Typography>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Typography variant="caption" color="secondary">Tỷ lệ hài lòng (5 sao)</Typography>
            <Typography variant="caption" style={{ fontWeight: '700' }}>82%</Typography>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primaryColor, width: '82%' }]} />
          </View>
        </Card>

        <Card style={styles.statCardSmall}>
          <View style={[styles.iconBox, { backgroundColor: colors.dangerBg, marginBottom: 16 }]}><AlertTriangle color={colors.dangerText} size={24} /></View>
          <Typography variant="subtitle2" color="secondary">Báo cáo mới</Typography>
          <Typography variant="h1" style={{ marginVertical: 8 }}>24</Typography>
          <Typography variant="caption" color="danger">+12% so với tuần trước</Typography>
        </Card>

        <Card style={styles.statCardSmall}>
          <View style={[styles.iconBox, { backgroundColor: colors.infoBg, marginBottom: 16 }]}><FileCheck2 color={colors.infoText} size={24} /></View>
          <Typography variant="subtitle2" color="secondary">Đánh giá tháng</Typography>
          <Typography variant="h1" style={{ marginVertical: 8 }}>1,240</Typography>
          <Typography variant="caption" color="info">+5% lượt mới</Typography>
        </Card>
      </View>

      <View style={styles.mainGrid}>
        <View style={styles.colLeft}>
          <View style={styles.sectionHeader}>
            <Typography variant="h4">Báo cáo vi phạm</Typography>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Typography variant="subtitle2" color="brand">Xem tất cả</Typography>
              <ArrowRight color={colors.primaryColor} size={16} />
            </TouchableOpacity>
          </View>
          
          {reportData.map((item) => (
            <Card key={item.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={[styles.chip, { backgroundColor: colors.dangerBg }]}>
                  <Typography variant="caption" color="danger" style={{ fontWeight: '700' }}>{item.type}</Typography>
                </View>
                <Typography variant="caption" color="muted">{item.time}</Typography>
              </View>
              <Typography variant="body1" style={{ fontStyle: 'italic', marginVertical: 16 }}>{item.desc}</Typography>
              <View style={[styles.targetBox, { backgroundColor: colors.bgPrimary }]}>
                <View style={[styles.targetIcon, { backgroundColor: colors.primaryColor }]} />
                <View>
                  <Typography variant="subtitle2">{item.target}</Typography>
                  <Typography variant="caption" color="secondary">{item.targetBy}</Typography>
                </View>
              </View>
              <View style={styles.actionRow}>
                <Button style={{ flex: 1 }} onPress={() => handleAcceptReport(item.id)}>Chấp nhận</Button>
                <Button variant="outline" style={{ flex: 1 }} onPress={() => handleRejectReport(item.id)}>Bác bỏ</Button>
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.colRight}>
          <View style={styles.sectionHeader}>
            <Typography variant="h4">Đánh giá công ty</Typography>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Typography variant="subtitle2" color="brand">Xem tất cả</Typography>
              <ArrowRight color={colors.primaryColor} size={16} />
            </TouchableOpacity>
          </View>

          {reviewData.map((item) => (
            <Card key={item.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.avatar, { backgroundColor: colors.borderLight }]} />
                  <View>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="caption" color="secondary">{item.company}</Typography>
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
