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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { classApi } from '../../api/classApi';
import { ClassItem } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { Header } from '../../components/common/Header';

export default function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClasses = async () => {
    try {
      const res = await classApi.getClasses();
      setClasses(res.classes || []);
    } catch (error) {
      console.warn('[Dashboard loadClasses error]', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadClasses();
  };

  const totalStudents = classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Teacher Portal"
        subtitle={`Welcome, ${user?.name || 'Faculty'}`}
        rightAction={{
          icon: 'person-circle-outline',
          onPress: () => router.push('/(teacher)/profile'),
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
        {/* Metric Cards Row */}
        <View style={styles.metricsRow}>
          <StatCard
            title="Assigned Classes"
            value={classes.length}
            icon="albums-outline"
            color={Colors.navyPrimary}
            bgColor={Colors.navySoft}
          />
          <StatCard
            title="Enrolled Students"
            value={totalStudents}
            icon="people-outline"
            color={Colors.accentBlue}
            bgColor="#EFF6FF"
          />
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.markAttendanceCTA}
          onPress={() => router.push('/(teacher)/attendance/mark')}
          activeOpacity={0.85}
        >
          <View style={styles.ctaIconCircle}>
            <Ionicons name="checkbox-outline" size={28} color={Colors.white} />
          </View>
          <View style={styles.ctaTextContainer}>
            <Text style={styles.ctaTitle}>Mark Daily Attendance</Text>
            <Text style={styles.ctaSubtitle}>
              Take attendance for {todayFormatted} • Instant duplicate check
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.white} />
        </TouchableOpacity>

        {/* Quick Nav Grid */}
        <Text style={styles.sectionHeader}>Quick Navigation</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push('/(teacher)/classes')}
            activeOpacity={0.7}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="business-outline" size={22} color={Colors.navyPrimary} />
            </View>
            <Text style={styles.gridCardTitle}>Manage Classes</Text>
            <Text style={styles.gridCardSub}>View, add & edit course sections</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push('/(teacher)/students')}
            activeOpacity={0.7}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="person-add-outline" size={22} color={Colors.present} />
            </View>
            <Text style={styles.gridCardTitle}>Student Roster</Text>
            <Text style={styles.gridCardSub}>Search, enroll & edit student data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push('/(teacher)/attendance/history')}
            activeOpacity={0.7}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time-outline" size={22} color={Colors.late} />
            </View>
            <Text style={styles.gridCardTitle}>History & Audit</Text>
            <Text style={styles.gridCardSub}>Past sessions & authorized edits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push('/(teacher)/attendance/reports')}
            activeOpacity={0.7}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="bar-chart-outline" size={22} color={Colors.danger} />
            </View>
            <Text style={styles.gridCardTitle}>Reports & CSV</Text>
            <Text style={styles.gridCardSub}>75% threshold alerts & exports</Text>
          </TouchableOpacity>
        </View>

        {/* Assigned Classes Quick List */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionHeader}>Your Active Classes</Text>
          <TouchableOpacity onPress={() => router.push('/(teacher)/classes')}>
            <Text style={styles.viewAllText}>View All ({classes.length})</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={Colors.navyPrimary} style={{ margin: 20 }} />
        ) : classes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No classes assigned yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first MCA subject class to begin tracking attendance.
            </Text>
          </View>
        ) : (
          classes.map((cls) => (
            <TouchableOpacity
              key={cls._id}
              style={styles.classCard}
              onPress={() => router.push(`/(teacher)/classes/${cls._id}`)}
              activeOpacity={0.75}
            >
              <View style={styles.classHeaderRow}>
                <View style={styles.codePill}>
                  <Text style={styles.codeText}>{cls.code}</Text>
                </View>
                <Text style={styles.semesterText}>{cls.semester}</Text>
              </View>

              <Text style={styles.className}>{cls.name}</Text>
              <Text style={styles.subjectText}>{cls.subject}</Text>

              <View style={styles.classFooter}>
                <View style={styles.studentCountBox}>
                  <Ionicons name="people" size={14} color={Colors.textMuted} />
                  <Text style={styles.studentCountText}>
                    {cls.students?.length || 0} Students Enrolled
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.quickMarkBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/(teacher)/attendance/mark',
                      params: { classId: cls._id },
                    })
                  }
                >
                  <Text style={styles.quickMarkText}>Take Attendance</Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.navyPrimary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
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
    paddingBottom: 36,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  markAttendanceCTA: {
    backgroundColor: Colors.navyPrimary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    ...Shadows.medium,
  },
  ctaIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
  },
  ctaSubtitle: {
    fontSize: 12,
    color: '#BFDBFE',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  gridCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.small,
  },
  gridIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  gridCardSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentBlue,
  },
  classCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
    ...Shadows.small,
  },
  classHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codePill: {
    backgroundColor: Colors.navySoft,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.navyPrimary,
  },
  semesterText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subjectText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  studentCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentCountText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  quickMarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.navySoft,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  quickMarkText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navyPrimary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
