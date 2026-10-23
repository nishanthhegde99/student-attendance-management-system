import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../theme/colors';
import { classApi } from '../../../api/classApi';
import { attendanceApi } from '../../../api/attendanceApi';
import { ClassItem, Student, AttendanceStatus } from '../../../types';
import { Header } from '../../../components/common/Header';
import { Button } from '../../../components/common/Button';
import { ConfirmModal } from '../../../components/common/ConfirmModal';

interface StudentAttendanceDraft {
  student: Student;
  status: AttendanceStatus;
  remarks: string;
}

export default function MarkAttendanceScreen() {
  const router = useRouter();
  const { classId: routeClassId } = useLocalSearchParams<{ classId?: string }>();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(routeClassId || '');
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [drafts, setDrafts] = useState<StudentAttendanceDraft[]>([]);
  const [subject, setSubject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [existingSessionFound, setExistingSessionFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // 1. Load Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classApi.getClasses();
        const loadedClasses = res.classes || [];
        setClasses(loadedClasses);

        if (loadedClasses.length > 0) {
          const targetId = routeClassId || loadedClasses[0]._id;
          setSelectedClassId(targetId);
        }
      } catch (e) {
        console.warn('[MarkAttendance load classes error]', e);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [routeClassId]);

  // 2. When Class or Date changes, check existing session & load students
  useEffect(() => {
    if (!selectedClassId) return;

    const loadClassAndSession = async () => {
      setCheckingExisting(true);
      try {
        const classRes = await classApi.getClassById(selectedClassId);
        const cls = classRes.class;
        setSubject(cls.subject);

        // Check if attendance is already submitted for this class & date
        const attendanceRes = await attendanceApi.getAttendanceByDate(
          selectedClassId,
          sessionDate,
          cls.subject
        );

        if (attendanceRes.sessionExists && attendanceRes.records?.length > 0) {
          setExistingSessionFound(true);
          // Populate drafts from existing submitted session records
          const existingMap = new Map<string, any>();
          attendanceRes.records.forEach((r) => {
            const sId = typeof r.student === 'object' ? r.student._id : r.student;
            existingMap.set(String(sId), r);
          });

          const loadedDrafts: StudentAttendanceDraft[] = (cls.students || []).map((s) => {
            const existingRecord = existingMap.get(String(s._id));
            return {
              student: s,
              status: existingRecord ? existingRecord.status : 'present',
              remarks: existingRecord?.remarks || '',
            };
          });
          setDrafts(loadedDrafts);
        } else {
          setExistingSessionFound(false);
          // Initialize fresh draft with all marked present by default
          const freshDrafts: StudentAttendanceDraft[] = (cls.students || []).map((s) => ({
            student: s,
            status: 'present',
            remarks: '',
          }));
          setDrafts(freshDrafts);
        }
      } catch (error) {
        console.warn('[MarkAttendance load error]', error);
      } finally {
        setCheckingExisting(false);
      }
    };

    loadClassAndSession();
  }, [selectedClassId, sessionDate]);

  const updateStudentStatus = (index: number, status: AttendanceStatus) => {
    setDrafts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status };
      return next;
    });
  };

  const markAll = (status: AttendanceStatus) => {
    setDrafts((prev) => prev.map((d) => ({ ...d, status })));
  };

  // Calculations for review
  const presentCount = drafts.filter((d) => d.status === 'present').length;
  const absentCount = drafts.filter((d) => d.status === 'absent').length;
  const lateCount = drafts.filter((d) => d.status === 'late').length;
  const totalStudents = drafts.length;

  const handleSubmitAttendance = async () => {
    setSubmitting(true);
    try {
      const payload = {
        classId: selectedClassId,
        sessionDate,
        subject,
        records: drafts.map((d) => ({
          studentId: d.student._id,
          status: d.status,
          remarks: d.remarks,
        })),
      };

      await attendanceApi.submitAttendance(payload);
      setConfirmModalVisible(false);

      Alert.alert(
        'Attendance Recorded!',
        `Successfully logged attendance for ${totalStudents} students on ${sessionDate}.`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(teacher)/dashboard'),
          },
        ]
      );
    } catch (error: any) {
      setConfirmModalVisible(false);
      Alert.alert('Submission Failed', error.message || 'Network error saving attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Mark Attendance"
        subtitle={selectedClass ? `${selectedClass.name}` : 'Select Class'}
        showBack
      />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Class Selection Dropdown/Chips */}
        <Text style={styles.sectionLabel}>Select Course Section</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classChipsRow}>
          {classes.map((cls) => (
            <TouchableOpacity
              key={cls._id}
              style={[
                styles.classChip,
                selectedClassId === cls._id ? styles.classChipActive : null,
              ]}
              onPress={() => setSelectedClassId(cls._id)}
            >
              <Text
                style={[
                  styles.classChipText,
                  selectedClassId === cls._id ? styles.classChipTextActive : null,
                ]}
              >
                {cls.code} • {cls.subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date & Subject Info Card */}
        <View style={styles.sessionInfoCard}>
          <View style={styles.sessionHeaderRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoSmallLabel}>ATTENDANCE DATE</Text>
              <Text style={styles.infoMainText}>{sessionDate}</Text>
            </View>
            <View style={styles.infoColRight}>
              <Text style={styles.infoSmallLabel}>SUBJECT</Text>
              <Text style={styles.infoMainText} numberOfLines={1}>
                {subject || 'General Lecture'}
              </Text>
            </View>
          </View>

          {existingSessionFound && (
            <View style={styles.warningBanner}>
              <Ionicons name="information-circle" size={18} color={Colors.warning} />
              <Text style={styles.warningBannerText}>
                Attendance already submitted for this date. Go to History & Audit to edit records.
              </Text>
            </View>
          )}
        </View>

        {/* Summary Metric Ribbon */}
        <View style={styles.summaryRibbon}>
          <View style={styles.ribbonItem}>
            <Text style={styles.ribbonVal}>{totalStudents}</Text>
            <Text style={styles.ribbonLabel}>TOTAL</Text>
          </View>
          <View style={[styles.ribbonItem, { backgroundColor: Colors.presentLight }]}>
            <Text style={[styles.ribbonVal, { color: Colors.present }]}>{presentCount}</Text>
            <Text style={[styles.ribbonLabel, { color: Colors.present }]}>PRESENT</Text>
          </View>
          <View style={[styles.ribbonItem, { backgroundColor: Colors.absentLight }]}>
            <Text style={[styles.ribbonVal, { color: Colors.absent }]}>{absentCount}</Text>
            <Text style={[styles.ribbonLabel, { color: Colors.absent }]}>ABSENT</Text>
          </View>
          <View style={[styles.ribbonItem, { backgroundColor: Colors.lateLight }]}>
            <Text style={[styles.ribbonVal, { color: Colors.late }]}>{lateCount}</Text>
            <Text style={[styles.ribbonLabel, { color: Colors.late }]}>LATE</Text>
          </View>
        </View>

        {/* Bulk Action Controls */}
        <View style={styles.bulkRow}>
          <Text style={styles.rosterSectionTitle}>Student Attendance Roster</Text>
          {!existingSessionFound && (
            <View style={styles.bulkButtons}>
              <TouchableOpacity
                style={[styles.bulkBtn, { backgroundColor: Colors.presentLight }]}
                onPress={() => markAll('present')}
              >
                <Text style={[styles.bulkBtnText, { color: Colors.present }]}>All Present</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bulkBtn, { backgroundColor: Colors.absentLight }]}
                onPress={() => markAll('absent')}
              >
                <Text style={[styles.bulkBtnText, { color: Colors.absent }]}>All Absent</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Students Roster */}
        {checkingExisting ? (
          <ActivityIndicator size="large" color={Colors.navyPrimary} style={{ margin: 30 }} />
        ) : drafts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Students in this Class</Text>
            <Text style={styles.emptyDesc}>
              Enroll students first from the Student Directory before marking attendance.
            </Text>
          </View>
        ) : (
          drafts.map((draft, index) => {
            const isP = draft.status === 'present';
            const isA = draft.status === 'absent';
            const isL = draft.status === 'late';

            return (
              <View key={draft.student._id} style={styles.studentRowCard}>
                <View style={styles.rollCircle}>
                  <Text style={styles.rollNumberText}>
                    {draft.student.rollNumber || (index + 1)}
                  </Text>
                </View>

                <View style={styles.studentDetails}>
                  <Text style={styles.studentNameText}>{draft.student.name}</Text>
                  <Text style={styles.studentIdText}>{draft.student.studentId}</Text>
                </View>

                {/* Status Toggle Buttons */}
                <View style={styles.statusButtonsGroup}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, isP ? styles.btnPresentActive : null]}
                    onPress={() => updateStudentStatus(index, 'present')}
                    disabled={existingSessionFound}
                  >
                    <Text style={[styles.toggleText, isP ? styles.toggleTextActive : null]}>
                      P
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, isL ? styles.btnLateActive : null]}
                    onPress={() => updateStudentStatus(index, 'late')}
                    disabled={existingSessionFound}
                  >
                    <Text style={[styles.toggleText, isL ? styles.toggleTextActive : null]}>
                      L
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, isA ? styles.btnAbsentActive : null]}
                    onPress={() => updateStudentStatus(index, 'absent')}
                    disabled={existingSessionFound}
                  >
                    <Text style={[styles.toggleText, isA ? styles.toggleTextActive : null]}>
                      A
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Submit Review CTA */}
        {drafts.length > 0 && !existingSessionFound && (
          <Button
            title="Review & Submit Attendance"
            variant="primary"
            size="lg"
            onPress={() => setConfirmModalVisible(true)}
            style={styles.submitCTA}
            icon={<Ionicons name="checkmark-done" size={20} color={Colors.white} />}
          />
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={confirmModalVisible}
        title="Confirm Attendance Submission"
        message={`Are you sure you want to submit attendance for ${selectedClass?.name || 'this class'} on ${sessionDate}?`}
        confirmText="Confirm & Save"
        confirmVariant="primary"
        loading={submitting}
        onConfirm={handleSubmitAttendance}
        onCancel={() => setConfirmModalVisible(false)}
        details={[
          { label: 'Subject', value: subject },
          { label: 'Total Students', value: totalStudents },
          { label: 'Present', value: presentCount, color: Colors.present },
          { label: 'Late', value: lateCount, color: Colors.late },
          { label: 'Absent', value: absentCount, color: Colors.absent },
        ]}
      />
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  classChipsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  classChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginRight: 8,
  },
  classChipActive: {
    backgroundColor: Colors.navyPrimary,
    borderColor: Colors.navyPrimary,
  },
  classChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  classChipTextActive: {
    color: Colors.white,
  },
  sessionInfoCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
    ...Shadows.small,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
  },
  infoColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoSmallLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  infoMainText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningBannerText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '600',
    flex: 1,
  },
  summaryRibbon: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  ribbonItem: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  ribbonVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  ribbonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 2,
  },
  bulkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rosterSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bulkButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  bulkBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  bulkBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  studentRowCard: {
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rollNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.navyPrimary,
  },
  studentDetails: {
    flex: 1,
  },
  studentNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  studentIdText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statusButtonsGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  btnPresentActive: {
    backgroundColor: Colors.present,
  },
  btnLateActive: {
    backgroundColor: Colors.late,
  },
  btnAbsentActive: {
    backgroundColor: Colors.absent,
  },
  submitCTA: {
    marginTop: 18,
    marginBottom: 20,
  },
  emptyCard: {
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
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
