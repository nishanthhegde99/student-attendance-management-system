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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../theme/colors';
import { classApi } from '../../../api/classApi';
import { ClassItem, Student } from '../../../types';
import { Header } from '../../../components/common/Header';
import { Button } from '../../../components/common/Button';

export default function ClassDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [classItem, setClassItem] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDetails = async () => {
    if (!id) return;
    try {
      const res = await classApi.getClassById(id);
      setClassItem(res.class);
    } catch (e) {
      console.warn('[ClassDetail error]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Class Roster" showBack />
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.navyPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!classItem) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Class Roster" showBack />
        <View style={styles.loadingBox}>
          <Text style={styles.errorText}>Class not found or deleted.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const enrolledStudents: Student[] = classItem.students || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={classItem.name}
        subtitle={`${classItem.code} • ${classItem.subject}`}
        showBack
      />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDetails();
            }}
          />
        }
      >
        {/* Course Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.codeRow}>
            <View style={styles.codePill}>
              <Text style={styles.codeText}>{classItem.code}</Text>
            </View>
            <Text style={styles.semesterText}>{classItem.semester}</Text>
          </View>
          <Text style={styles.subjectText}>{classItem.subject}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Academic Year: {classItem.academicYear}</Text>
            <Text style={styles.metaLabel}>Room: {classItem.roomNumber || 'N/A'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <Button
            title="Mark Attendance"
            variant="primary"
            size="md"
            icon={<Ionicons name="checkbox-outline" size={18} color={Colors.white} />}
            onPress={() =>
              router.push({
                pathname: '/(teacher)/attendance/mark',
                params: { classId: classItem._id },
              })
            }
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            title="Class Report"
            variant="outline"
            size="md"
            icon={<Ionicons name="bar-chart-outline" size={18} color={Colors.navyPrimary} />}
            onPress={() =>
              router.push({
                pathname: '/(teacher)/attendance/reports',
                params: { classId: classItem._id },
              })
            }
            style={{ flex: 1 }}
          />
        </View>

        {/* Enrolled Students Header */}
        <View style={styles.rosterHeader}>
          <Text style={styles.rosterTitle}>Enrolled Students ({enrolledStudents.length})</Text>
          <TouchableOpacity
            style={styles.addStudentBtn}
            onPress={() =>
              router.push({
                pathname: '/(teacher)/students/new',
                params: { preselectedClassId: classItem._id },
              })
            }
          >
            <Ionicons name="person-add" size={14} color={Colors.navyPrimary} />
            <Text style={styles.addStudentText}>Enroll Student</Text>
          </TouchableOpacity>
        </View>

        {enrolledStudents.length === 0 ? (
          <View style={styles.emptyRoster}>
            <Ionicons name="people-outline" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyRosterTitle}>No students enrolled</Text>
            <Text style={styles.emptyRosterDesc}>
              Tap "+ Enroll Student" to add students to this class section.
            </Text>
          </View>
        ) : (
          enrolledStudents.map((s, idx) => (
            <View key={s._id || idx} style={styles.studentCard}>
              <View style={styles.rollCircle}>
                <Text style={styles.rollText}>{s.rollNumber || (idx + 1)}</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{s.name}</Text>
                <Text style={styles.studentUSN}>{s.studentId} • {s.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
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
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 15,
    color: Colors.danger,
  },
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 18,
    paddingBottom: 36,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    ...Shadows.small,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codePill: {
    backgroundColor: Colors.navySoft,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navyPrimary,
  },
  semesterText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rosterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addStudentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.navySoft,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  addStudentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.navyPrimary,
  },
  emptyRoster: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyRosterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptyRosterDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  studentCard: {
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
  rollCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rollText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navyPrimary,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  studentUSN: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
