import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../theme/colors';
import { classApi } from '../../../api/classApi';
import { attendanceApi } from '../../../api/attendanceApi';
import { ClassItem, ClassReport } from '../../../types';
import { Header } from '../../../components/common/Header';
import { AttendanceChart } from '../../../components/charts/AttendanceChart';
import { StatCard } from '../../../components/common/StatCard';
import { Button } from '../../../components/common/Button';

export default function AttendanceReportsScreen() {
  const { classId: routeClassId } = useLocalSearchParams<{ classId?: string }>();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(routeClassId || '');
  const [report, setReport] = useState<ClassReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReportData = async () => {
    try {
      const classRes = await classApi.getClasses();
      const loadedClasses = classRes.classes || [];
      setClasses(loadedClasses);

      const targetId = selectedClassId || (loadedClasses.length > 0 ? loadedClasses[0]._id : '');
      if (targetId) {
        setSelectedClassId(targetId);
        const reportRes = await attendanceApi.getClassReport(targetId);
        setReport(reportRes);
      }
    } catch (e) {
      console.warn('[AttendanceReports load error]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedClassId]);

  const handleExportCSV = async () => {
    if (!selectedClassId) return;
    const csvUrl = attendanceApi.getExportCsvUrl(selectedClassId);
    try {
      await Share.share({
        title: 'MCA Attendance Report CSV',
        message: `Download the complete class attendance CSV report here: ${csvUrl}`,
        url: csvUrl,
      });
    } catch (error) {
      Alert.alert('Export Link', `Access CSV report at: ${csvUrl}`);
    }
  };

  const totalPresent = (report?.students || []).reduce((acc, s) => acc + s.stats.presentCount, 0);
  const totalAbsent = (report?.students || []).reduce((acc, s) => acc + s.stats.absentCount, 0);
  const totalLate = (report?.students || []).reduce((acc, s) => acc + s.stats.lateCount, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Attendance Analytics"
        subtitle="Eligibility & Performance Reports"
        showBack
        rightAction={{
          icon: 'download-outline',
          onPress: handleExportCSV,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadReportData();
            }}
          />
        }
      >
        {/* Class Selection Chips */}
        <Text style={styles.sectionHeader}>Select Class Section</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classChipsRow}>
          {classes.map((c) => (
            <TouchableOpacity
              key={c._id}
              style={[
                styles.chip,
                selectedClassId === c._id ? styles.chipActive : null,
              ]}
              onPress={() => setSelectedClassId(c._id)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedClassId === c._id ? styles.chipTextActive : null,
                ]}
              >
                {c.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.navyPrimary} style={{ margin: 40 }} />
        ) : !report ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No report data available.</Text>
          </View>
        ) : (
          <>
            {/* Quick Summary Cards */}
            <View style={styles.metricsRow}>
              <StatCard
                title="Class Average"
                value={`${report.classAveragePercentage}%`}
                icon="trending-up-outline"
                color={report.classAveragePercentage >= 75 ? Colors.present : Colors.danger}
                bgColor={report.classAveragePercentage >= 75 ? Colors.presentLight : Colors.absentLight}
              />
              <StatCard
                title="Low Attendance"
                value={report.lowAttendanceCount}
                subtitle="Below 75% Requirement"
                icon="warning-outline"
                color={Colors.warning}
                bgColor="#FEF3C7"
              />
            </View>

            {/* Overall Attendance Visual Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>Class Attendance Distribution</Text>
              <AttendanceChart
                present={totalPresent}
                absent={totalAbsent}
                late={totalLate}
                percentage={report.classAveragePercentage}
              />
            </View>

            {/* Export CSV Banner Button */}
            <TouchableOpacity
              style={styles.exportBanner}
              onPress={handleExportCSV}
              activeOpacity={0.8}
            >
              <View style={styles.exportIconCircle}>
                <Ionicons name="document-text-outline" size={24} color={Colors.navyPrimary} />
              </View>
              <View style={styles.exportTextContainer}>
                <Text style={styles.exportTitle}>Download Official CSV Sheet</Text>
                <Text style={styles.exportSubtitle}>
                  Formatted with roll numbers, percentages and eligibility flags
                </Text>
              </View>
              <Ionicons name="share-outline" size={22} color={Colors.navyPrimary} />
            </TouchableOpacity>

            {/* Student Breakdown Table */}
            <Text style={styles.sectionHeader}>
              Student-Wise Breakdown ({report.students?.length || 0})
            </Text>

            {report.students?.map((item) => {
              const isShortage = item.stats.isLowAttendance;
              const pct = item.stats.attendancePercentage;

              return (
                <View
                  key={item.student.id}
                  style={[
                    styles.studentRow,
                    isShortage ? styles.studentRowShortage : null,
                  ]}
                >
                  <View style={styles.rollCircle}>
                    <Text style={styles.rollText}>{item.student.rollNumber}</Text>
                  </View>

                  <View style={styles.infoCol}>
                    <View style={styles.nameRow}>
                      <Text style={styles.studentName}>{item.student.name}</Text>
                      {isShortage && (
                        <View style={styles.shortagePill}>
                          <Text style={styles.shortagePillText}>SHORTAGE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.studentMeta}>
                      USN: {item.student.studentId} • P: {item.stats.presentCount} | L: {item.stats.lateCount} | A: {item.stats.absentCount}
                    </Text>
                  </View>

                  <View style={styles.percentageCol}>
                    <Text
                      style={[
                        styles.pctNumber,
                        { color: isShortage ? Colors.danger : Colors.present },
                      ]}
                    >
                      {pct}%
                    </Text>
                    <Text style={styles.sessionsTotal}>
                      of {item.stats.totalSessions} sessions
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
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
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  classChipsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.navyPrimary,
    borderColor: Colors.navyPrimary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    ...Shadows.small,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  exportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navySoft,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
  },
  exportIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exportTextContainer: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navyPrimary,
  },
  exportSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  studentRow: {
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
  studentRowShortage: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },
  rollCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rollText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.navyPrimary,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  shortagePill: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  shortagePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.danger,
  },
  studentMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  percentageCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  pctNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  sessionsTotal: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
