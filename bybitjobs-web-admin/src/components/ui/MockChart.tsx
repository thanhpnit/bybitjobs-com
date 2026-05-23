import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '../../context/ThemeContext';

interface MockChartProps {
  type: 'line' | 'bar';
  data: number[];
  labels: string[];
  height?: number;
  color?: string;
}

export const MockChart: React.FC<MockChartProps> = ({ type, data, labels, height = 220, color }) => {
  const { colors } = useTheme();
  const maxData = Math.max(...data, 1);
  const themeColor = color || colors.primaryColor;

  return (
    <View style={[styles.container, { height }]}>
      {/* Y Axis Guides */}
      <View style={styles.guides}>
        {[4, 3, 2, 1, 0].map((step) => (
          <View key={step} style={[styles.guideLine, { borderBottomColor: colors.borderLight }]}>
            <Typography variant="caption" color="muted" style={styles.guideText}>
              {Math.round((maxData / 4) * step)}
            </Typography>
          </View>
        ))}
      </View>

      {/* Chart Content */}
      <View style={styles.chartArea}>
        {data.map((value, index) => {
          const heightPct = `${(value / maxData) * 100}%` as DimensionValue;
          return (
            <View key={index} style={styles.dataPoint}>
              {type === 'bar' ? (
                <View style={[styles.bar, { height: heightPct, backgroundColor: themeColor }]} />
              ) : (
                <View style={styles.lineColumn}>
                  <View style={[styles.dot, { bottom: heightPct, backgroundColor: themeColor }]} />
                  {/* Simplified line visualization using just dots for pure View implementation */}
                  <View style={[styles.verticalLine, { height: heightPct, backgroundColor: themeColor, opacity: 0.2 }]} />
                </View>
              )}
              <Typography variant="caption" color="secondary" style={styles.labelText}>
                {labels[index]}
              </Typography>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    marginTop: 20,
    marginBottom: 10,
  },
  guides: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingBottom: 24, // Space for labels
  },
  guideLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'flex-end',
  },
  guideText: {
    position: 'absolute',
    left: 0,
    bottom: 4,
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 40, // Space for Y axis labels
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  dataPoint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  bar: {
    width: '60%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  lineColumn: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    transform: [{ translateY: 4 }],
    zIndex: 2,
  },
  verticalLine: {
    width: 2,
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  labelText: {
    position: 'absolute',
    bottom: -24,
    textAlign: 'center',
  }
});
