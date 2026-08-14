import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';

export interface ChartDataPoint {
  date: string;
  totalOrders: number;
  successOrders: number;
  revenue: number;
}

interface ModernBarChartProps {
  data: ChartDataPoint[];
  maxRevenue: number;
  height?: number;
}

export const ModernBarChart: React.FC<ModernBarChartProps> = ({ data, maxRevenue, height = 240 }) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const safeMax = Math.max(maxRevenue, 1);
  const peakPoint = data.reduce((prev, curr) => (curr.revenue > prev.revenue ? curr : prev), data[0] || { revenue: 0 });

  return (
    <View style={styles.container}>
      {/* Top Peak Day Summary Banner */}
      <View style={[styles.summaryBanner, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF', borderColor: colors.primaryLight }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Typography variant="caption" color="brand" style={{ fontWeight: '700' }}>🏆 NGÀY CAO NHẤT:</Typography>
          <Typography variant="subtitle2" style={{ fontWeight: '700' }}>
            {peakPoint?.date ? `${peakPoint.date}` : 'Chưa có'}
          </Typography>
        </View>
        <Typography variant="subtitle2" color="brand" style={{ fontWeight: '700' }}>
          {peakPoint?.revenue ? `${peakPoint.revenue.toLocaleString()}đ` : '0đ'}
        </Typography>
      </View>

      {/* Main Chart Area */}
      <View style={[styles.chartBox, { height }]}>
        {/* Y-Axis Gridlines */}
        <View style={styles.gridLines}>
          <View style={[styles.gridLine, { borderBottomColor: colors.borderLight }]}>
            <Typography variant="caption" color="muted" style={styles.yLabel}>
              {safeMax >= 1000000 ? `${(safeMax / 1000000).toFixed(1)}M` : safeMax >= 1000 ? `${(safeMax / 1000).toFixed(0)}k` : `${safeMax}`}
            </Typography>
          </View>
          <View style={[styles.gridLine, { borderBottomColor: colors.borderLight }]}>
            <Typography variant="caption" color="muted" style={styles.yLabel}>
              {safeMax / 2 >= 1000000 ? `${(safeMax / 2000000).toFixed(1)}M` : safeMax / 2 >= 1000 ? `${(safeMax / 2000).toFixed(0)}k` : `${Math.round(safeMax / 2)}`}
            </Typography>
          </View>
          <View style={[styles.gridLine, { borderBottomColor: colors.borderColor }]}>
            <Typography variant="caption" color="muted" style={styles.yLabel}>0đ</Typography>
          </View>
        </View>

        {/* Scrollable Bars Container */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.barsScrollContent}>
          <View style={styles.barsWrapper}>
            {data.map((item, index) => {
              const isHovered = hoveredIndex === index;
              const hasRevenue = item.revenue > 0;
              const heightPercent = hasRevenue ? Math.max(12, Math.round((item.revenue / safeMax) * 100)) : 4;
              const shortDate = item.date.startsWith('Tháng')
                ? `T${item.date.split(' ')[1]?.split('/')[0] || ''}`
                : item.date.split('/').slice(0, 2).join('/');

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  onPressIn={() => setHoveredIndex(index)}
                  onPressOut={() => setHoveredIndex(null)}
                  style={styles.barColumn}
                >
                  {/* Floating Tooltip Card */}
                  {isHovered && (
                    <View style={[styles.tooltipCard, { backgroundColor: isDark ? '#2A2D34' : '#1E293B', borderColor: colors.primaryColor }]}>
                      <Typography variant="caption" style={{ color: '#94A3B8', fontWeight: '600' }}>{item.date}</Typography>
                      <Typography variant="subtitle2" style={{ color: '#FFFFFF', fontWeight: '700', marginVertical: 2 }}>
                        {item.revenue.toLocaleString()} VNĐ
                      </Typography>
                      <Typography variant="caption" style={{ color: '#38BDF8' }}>
                        {item.successOrders} / {item.totalOrders} đơn thành công
                      </Typography>
                    </View>
                  )}

                  {/* Revenue Pill Tag above active bar */}
                  {hasRevenue && !isHovered && (
                    <View style={[styles.revenueTag, { backgroundColor: colors.primaryColor }]}>
                      <Typography variant="caption" style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>
                        {item.revenue >= 1000000 ? `${(item.revenue / 1000000).toFixed(1)}M` : item.revenue >= 1000 ? `${(item.revenue / 1000).toFixed(0)}k` : `${item.revenue}`}
                      </Typography>
                    </View>
                  )}

                  {/* Bar Body */}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPercent}%`,
                          backgroundColor: hasRevenue ? colors.primaryColor : colors.borderLight,
                          opacity: isHovered ? 1 : hasRevenue ? 0.9 : 0.4,
                        },
                      ]}
                    />
                  </View>

                  {/* X-Axis Date Label */}
                  <Typography
                    variant="caption"
                    color={hasRevenue ? 'brand' : isHovered ? 'primary' : 'muted'}
                    style={[styles.xLabel, hasRevenue && { fontWeight: '700' }]}
                  >
                    {shortDate}
                  </Typography>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartBox: {
    position: 'relative',
    width: '100%',
    justifyContent: 'flex-end',
  },
  gridLines: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 24,
    justifyContent: 'space-between',
  },
  gridLine: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
  },
  yLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  barsScrollContent: {
    paddingLeft: 40,
    paddingRight: 16,
    paddingBottom: 4,
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
    height: '100%',
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 42,
    height: '100%',
    position: 'relative',
  },
  barTrack: {
    width: 20,
    height: '80%',
    justifyContent: 'flex-end',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 10,
  },
  xLabel: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  revenueTag: {
    position: 'absolute',
    top: 0,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 2,
  },
  tooltipCard: {
    position: 'absolute',
    bottom: '85%',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 130,
    alignItems: 'center',
    zIndex: 10,
  },
});
