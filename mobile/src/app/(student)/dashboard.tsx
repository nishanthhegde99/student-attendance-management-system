import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi } from '../../api/attendanceApi';
import { AttendanceStats, AttendanceRecordItem } from '../../types';
import { Header } from '../../components/common/Header';
import { AttendanceChart } from '../../components/charts/AttendanceChart';
import { StatCard } from '../../components/common/StatCard';
import { triggerLowAttendanceAlert } from '../../utils/notifications';

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecordItem[]>([]);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudentData = async () => {
    try {
      // If linkedStudentId exists, pass it; otherwise pass 'me' or user id
      const targetId = user?.linkedStudentId || 'me';
      const res = await attendanceApi.getStudentAttendance(String(targetId));
      setStats(res.stats);
      setStudentDetails(res.student);
      setRecentRecords(res.records.slice(0, 5));

      // Trigger low-attendance push notification if under 75%
      if (res.stats.isLowAttendance) {
        triggerLowAttendanceAlert(user?.name || 'Student', res.stats.attendancePercentage);
      }
    } catch (e) {
      console.warn('[StudentDashboard load error]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudentData();
  };

  const pct = stats?.attendancePercentage || 0;
  const isShortage = stats?.isLowAttendance || false;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Student Portal"
        subtitle={`Welcome, ${user?.name || 'Student'}`}
        rightAction={{
          icon: 'person-circle-outline',
          onPress: () => router.push('/(student)/profile'),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.navyPrimary]}
          />
        }
      >
        {/* Low Attendance Warning Alert Card */}
        {isShortage && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color={Colors.danger} />
              <Text style={styles.alertTitle}>Attendance Shortage Warning!</Text>
            </View>
            <Text style={styles.alertDesc}>
              Your current attendance is {pct}%, which is below the mandatory 75% university eligibility requirement.
            </Text>
            {stats && stats.shortageSessionsNeededFor75 > 0 && (
              <View style={styles.remedyBox}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
                <Text style={styles.remedyText}>
                  You need to attend at least {stats.shortageSessionsNeededFor75} consecutive upcoming sessions to regain eligibility.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Visual Overall Attendance Gauge */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Overall Attendance Performance</Text>
          <AttendanceChart
            present={stats?.presentCount || 0}
            absent={stats?.absentCount || 0}
            late={stats?.lateCount || 0}
            percentage={pct}
            size={160}
          />
        </View>

        {/* Metric Counts */}
        <View style={styles.metricsRow}>
          <StatCard
            title="Total Sessions"
            value={stats?.totalSessions || 0}
            icon="calendar-outline"
            color={Colors.navyPrimary}
            bgColor={Colors.navySoft}
          />
          <StatCard
            title="Present"
            value={stats?.presentCount || 0}
            icon="checkmark-circle-outline"
            color={Colors.present}
            bgColor={Colors.presentLight}
          />
        </View>

        <View style={styles.metricsRow}>
          <StatCard
            title="Late (0.5 Count)"
            value={stats?.lateCount || 0}
            icon="time-outline"
            color={Colors.late}
            bgColor={Colors.lateLight}
          />
          <StatCard
            title="Absent"
            value={stats?.absentCount || 0}
            icon="close-circle-outline"
            color={Colors.absent}
            bgColor={Colors.absentLight}
          />
        </View>

        {/* Attendance Calculation Rule Note */}
        <View style={styles.policyCard}>
          <View style={styles.policyHeader}>
            <Ionicons name="school-outline" size={16} color={Colors.navyPrimary} />
            <Text style={styles.policyTitle}>University Calculation Formula</Text>
          </View>
          <Text style={styles.policyFormula}>
            Percentage = ((Present + Late × 0.5) / Total Sessions) × 100
          </Text>
          <Text style={styles.policySub}>
            Present sessions count as 1.0, Late sessions count as 0.5, Absent counts as 0.0. Minimum 75% required for examination eligibility.
          </Text>
        </View>

        {/* Recent Timeline */}
        <View style={styles.recentHeaderRow}>
          <Text style={styles.sectionHeader}>Recent Attendance Timeline</Text>
          <TouchableOpacity onPress={() => router.push('/(student)/history')}>
            <Text style={styles.viewAllText}>View All History</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.navyPrimary} style={{ margin: 20 }} />
        ) : recentRecords.length === 0 ? (
          <View style={styles.emptyRecords}>
            <Text style={styles.emptyText}>No attendance records recorded yet.</Text>
          </View>
        ) : (
          recentRecords.map((r) => {
            const dateStr = new Date(r.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const subjectName =
              typeof r.session === 'object' && r.session
                ? (r.session as any).subject
                : 'Lecture Session';

            const isP = r.status === 'present';
            const isL = r.status === 'late';

            return (
              <View key={r._id} style={styles.timelineCard}>
                <View
                  style={[
                    styles.statusPill,
                    isP
                      ? styles.pillPresent
                      : isL
                      ? styles.pillLate
                      : styles.pillAbsent,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isP
                        ? { color: Colors.present }
                        : isL
                        ? { color: Colors.late }
                        : { color: Colors.absent },
                    ]}
                  >
                    {r.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.timelineSubject}>{subjectName}</Text>
                  <Text style={styles.timelineDate}>{dateStr}</Text>
                </View>

                {r.remarks ? (
                  <Text style={styles.timelineRemarks} numberOfLines={1}>
                    {r.remarks}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.navyPrimary,
  },
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 18,
    paddingBottom: 40,
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
    ...Shadows.small,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.danger,
  },
  alertDesc: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  remedyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  remedyText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '600',
    flex: 1,
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    alignItems: 'center',
    ...Shadows.small,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  policyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navyPrimary,
    textTransform: 'uppercase',
  },
  policyFormula: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginVertical: 4,
  },
  policySub: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accentBlue,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 8,
    ...Shadows.small,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 12,
  },
  pillPresent: {
    backgroundColor: Colors.presentLight,
  },
  pillLate: {
    backgroundColor: Colors.lateLight,
  },
  pillAbsent: {
    backgroundColor: Colors.absentLight,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timelineContent: {
    flex: 1,
  },
  timelineSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timelineDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  timelineRemarks: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
    maxWidth: 80,
  },
  emptyRecords: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
