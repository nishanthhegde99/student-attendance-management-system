import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Colors } from '../../theme/colors';

interface AttendanceChartProps {
  present: number;
  absent: number;
  late: number;
  percentage: number;
  size?: number;
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({
  present,
  absent,
  late,
  percentage,
  size = 140,
}) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(percentage, 100)) / 100;

  const total = present + absent + late;
  const presentPct = total === 0 ? 0 : Math.round((present / total) * 100);
  const absentPct = total === 0 ? 0 : Math.round((absent / total) * 100);
  const latePct = total === 0 ? 0 : Math.round((late / total) * 100);

  const getGaugeColor = () => {
    if (percentage >= 85) return Colors.present;
    if (percentage >= 75) return Colors.navyLight;
    return Colors.absent;
  };

  return (
    <View style={styles.container}>
      <View style={styles.gaugeContainer}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            {/* Background Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={getGaugeColor()}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </Svg>
        <View style={styles.centerTextContainer}>
          <Text style={[styles.percentageText, { color: getGaugeColor() }]}>
            {percentage}%
          </Text>
          <Text style={styles.attendanceLabel}>Attendance</Text>
        </View>
      </View>

      {/* Distribution Progress Bar */}
      <View style={styles.breakdownContainer}>
        <View style={styles.barContainer}>
          {total > 0 ? (
            <>
              {presentPct > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { flex: present, backgroundColor: Colors.present },
                  ]}
                />
              )}
              {latePct > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { flex: late, backgroundColor: Colors.late },
                  ]}
                />
              )}
              {absentPct > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { flex: absent, backgroundColor: Colors.absent },
                  ]}
                />
              )}
            </>
          ) : (
            <View style={[styles.barSegment, { flex: 1, backgroundColor: '#E2E8F0' }]} />
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.present }]} />
            <Text style={styles.legendLabel}>Present ({present})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.late }]} />
            <Text style={styles.legendLabel}>Late ({late})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.absent }]} />
            <Text style={styles.legendLabel}>Absent ({absent})</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  attendanceLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  breakdownContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  barContainer: {
    height: 10,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
