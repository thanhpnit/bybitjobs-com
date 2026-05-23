import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import { Filter, Download, MessageSquare, ClipboardList, AlertTriangle, Star, CheckCircle2, EyeOff, Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';

const reviews = [
  { id: '#RV-9021', name: 'Nguyễn Văn An', company: 'Công ty Công nghệ Alpha Soft', rating: 3, comment: '"Môi trường làm việc hơi áp lực, quản lý trực tiếp thường xuyên yêu cầu OT không lương. Tuy nhiên phúc lợi về bảo hiểm khá đầy đủ. Cần cải thiện quy trình làm việc để giảm tải cho nhân viên."', status: 'Bị báo cáo', time: 'Đăng 2 giờ trước' },
  { id: '#RV-9020', name: 'Lê Thị Mai', company: 'Logistics Toàn Cầu', rating: 5, comment: '"Công ty tuyệt vời, đồng nghiệp thân thiện và hỗ trợ nhiệt tình. Lương thưởng cạnh tranh và có lộ trình thăng tiến rõ ràng cho nhân viên mới. Rất đáng để ứng tuyển."', status: 'Chờ duyệt', time: 'Đăng 5 giờ trước' },
  { id: '#RV-9018', name: 'Trần Minh Hoàng', company: 'Chuỗi cửa hàng FreshMart', rating: 4, comment: '"Công việc ổn định, tuy nhiên ca tối thường kết thúc khá muộn. Quản lý cửa hàng rất công bằng trong việc chia ca. Mong muốn có thêm các buổi đào tạo kỹ năng cho nhân viên bán hàng."', status: 'Đã phê duyệt', time: 'Đăng 1 ngày trước' },
];

export const Reviews: React.FC = () => {
  const { colors } = useTheme();

  const [data, setData] = useState(reviews);

  const handleApprove = (id: string) => {
    setData(data.map(i => i.id === id ? { ...i, status: 'Đã phê duyệt' } : i));
  };

  const handleHide = (id: string) => {
    setData(data.map(i => i.id === id ? { ...i, status: 'Bị báo cáo' } : i));
  };

  const handleDelete = (id: string) => {
    setData(data.filter(i => i.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography variant="h2">Quản lý đánh giá công ty</Typography>
          <Typography variant="body1" color="secondary">
            Theo dõi và kiểm duyệt các phản hồi từ cộng đồng người lao động.
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
            <Typography variant="subtitle2" color="success">+12%~</Typography>
          </View>
          <Typography variant="subtitle2" color="secondary" style={{ marginTop: 12 }}>TỔNG ĐÁNH GIÁ</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>1,284</Typography>
        </Card>
        
        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.warningBg }]}><ClipboardList color={colors.warningText} size={20} /></View>
            <Typography variant="subtitle2" color="secondary">Cần xử lý</Typography>
          </View>
          <Typography variant="subtitle2" color="secondary" style={{ marginTop: 12 }}>CHỜ DUYỆT</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>42</Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.dangerBg }]}><AlertTriangle color={colors.dangerText} size={20} /></View>
            <Typography variant="subtitle2" color="danger">Ưu tiên</Typography>
          </View>
          <Typography variant="subtitle2" color="secondary" style={{ marginTop: 12 }}>BỊ BÁO CÁO</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>15</Typography>
        </Card>

        <Card style={styles.statCard}>
          <View style={styles.statIconRow}>
            <View style={[styles.iconWrapper, { backgroundColor: colors.primaryLight }]}><Star color={colors.primaryColor} size={20} /></View>
            <Typography variant="subtitle2" color="secondary">Trung bình</Typography>
          </View>
          <Typography variant="subtitle2" color="secondary" style={{ marginTop: 12 }}>ĐIỂM HÀI LÒNG</Typography>
          <Typography variant="h2" style={{ marginTop: 4 }}>4.2/5</Typography>
        </Card>
      </View>

      <View style={styles.listContainer}>
        {data.map((item, index) => (
          <Card key={item.id} style={styles.reviewCard}>
            <View style={styles.reviewContent}>
              <View style={styles.reviewHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={[styles.avatar, { backgroundColor: colors.borderLight }]} />
                  <View>
                    <Typography variant="subtitle1">{item.name}</Typography>
                    <Typography variant="caption" color="secondary">🏢 {item.company}</Typography>
                  </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} color={i < item.rating ? '#FACC15' : colors.borderLight} fill={i < item.rating ? '#FACC15' : 'transparent'} />
                  ))}
                </View>
              </View>

              <Typography variant="body1" style={{ marginTop: 16, marginBottom: 24, lineHeight: 24 }}>
                {item.comment}
              </Typography>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Badge status={item.status === 'Bị báo cáo' ? 'danger' : item.status === 'Chờ duyệt' ? 'warning' : 'success'}>
                  {item.status === 'Đã phê duyệt' ? '✓ Đã phê duyệt' : item.status === 'Chờ duyệt' ? '⏱ Chờ duyệt' : '⚑ Bị báo cáo'}
                </Badge>
                <Typography variant="body2" color="secondary">{item.time} • ID: {item.id}</Typography>
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
              >Xóa vĩnh viễn</Button>
            </View>
          </Card>
        ))}

        <View style={styles.pagination}>
          <Typography variant="body2" color="secondary">Hiển thị 1-10 trong số 1,284 đánh giá</Typography>
          <View style={styles.pageNumbers}>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><ChevronLeft size={16} color={colors.textSecondary} /></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { backgroundColor: colors.primaryColor, borderColor: colors.primaryColor }]}><Typography variant="body2" style={{ color: '#fff' }}>1</Typography></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><Typography variant="body2">2</Typography></TouchableOpacity>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><Typography variant="body2">3</Typography></TouchableOpacity>
            <View style={styles.pageDots}><Typography variant="body2">...</Typography></View>
            <TouchableOpacity style={[styles.pageBtn, { borderColor: colors.borderLight }]}><Typography variant="body2">128</Typography></TouchableOpacity>
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
  reviewCard: { flexDirection: 'row', padding: 0, overflow: 'hidden' },
  reviewContent: { flex: 3, padding: 32 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  actionSidebar: { flex: 1, padding: 32, borderLeftWidth: 1, justifyContent: 'center' },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16 },
  pageNumbers: { flexDirection: 'row', gap: 8 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pageDots: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }
});
