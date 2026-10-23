import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { AttendanceStatus } from '../../types';

interface BadgeProps {
  status?: AttendanceStatus;
  label?: string;
  variant?: 'present' | 'absent' | 'late' | 'info' | 'warning' | 'default';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  label,
  variant,
  size = 'md',
  style,
}) => {
  const effectiveVariant = variant || status || 'default';
  const displayLabel = label || (status ? status.toUpperCase() : '');

  const getBadgeColors = () => {
    switch (effectiveVariant) {
      case 'present':
        return {
          bg: Colors.presentLight,
          border: Colors.presentBorder,
          text: Colors.present,
        };
      case 'absent':
        return {
          bg: Colors.absentLight,
          border: Colors.absentBorder,
          text: Colors.absent,
        };
      case 'late':
        return {
          bg: Colors.lateLight,
          border: Colors.lateBorder,
          text: Colors.late,
        };
      case 'warning':
        return {
          bg: Colors.warningLight,
          border: '#FDE68A',
          text: Colors.warning,
        };
      case 'info':
        return {
          bg: Colors.navySoft,
          border: '#BFDBFE',
          text: Colors.navyPrimary,
        };
      default:
        return {
          bg: '#F1F5F9',
          border: '#E2E8F0',
          text: Colors.textSecondary,
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: colors.text },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSm: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeMd: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
