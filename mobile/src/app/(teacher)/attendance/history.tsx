import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../theme/colors';
import { classApi } from '../../../api/classApi';
import { attendanceApi } from '../../../api/attendanceApi';
import { ClassItem, AttendanceSessionItem, AttendanceRecordItem, AttendanceStatus } from '../../../types';
import { Header } from '../../../components/common/Header';
import { Badge } from '../../../components/common/Badge';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

export default function AttendanceHistoryScreen() {
  const router = useRouter();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [sessions, setSessions] = useState<AttendanceSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Expanded session details
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionRecords, setSessionRecords] = useState<AttendanceRecordItem[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Correction Modal State
  const [correctionModalVisible, setCorrectionModalVisible] = useState(false);
  const [targetRecord, setTargetRecord] = useState<AttendanceRecordItem | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('present');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correcting, setCorrecting] = useState(false);
  const [correctionError, setCorrectionError] = useState('');

  const loadClassesAndSessions = async () => {
    try {
      const classRes = await classApi.getClasses();
      const loadedClasses = classRes.classes || [];
      setClasses(loadedClasses);

      const targetClassId = selectedClassId || (loadedClasses.length > 0 ? loadedClasses[0]._id : '');
      if (targetClassId) {
        setSelectedClassId(targetClassId);
        const reportRes = await attendanceApi.getClassReport(targetClassId);
        setSessions(reportRes.sessions || []);
      }
    } catch (e) {
      console.warn('[AttendanceHistory load error]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClassesAndSessions();
  }, [selectedClassId]);

  const toggleExpandSession = async (session: AttendanceSessionItem) => {
    if (expandedSessionId === session._id) {
      setExpandedSessionId(null);
      setSessionRecords([]);
      return;
    }

    setExpandedSessionId(session._id);
    setLoadingRecords(true);
    try {
      const dateStr = session.sessionDate.split('T')[0];
      const classIdStr = typeof session.class === 'object' ? (session.class as any)._id : session.class;
      const res = await attendanceApi.getAttendanceByDate(classIdStr, dateStr, session.subject);
      setSessionRecords(res.records || []);
    } catch (error) {
      console.warn('[Fetch session records error]', error);
    } finally {
      setLoadingRecords(false);
    }
  };

  const openCorrectionModal = (record: AttendanceRecordItem) => {
    setTargetRecord(record);
    setNewStatus(record.status === 'present' ? 'late' : 'present');
    setCorrectionReason('');
    setCorrectionError('');
    setCorrectionModalVisible(true);
  };

  const handleApplyCorrection = async () => {
    if (!targetRecord || !correctionReason.trim()) {
      setCorrectionError('A detailed reason is required for audit compliance.');
      return;
    }

    setCorrecting(true);
    setCorrectionError('');
    try {
      await attendanceApi.correctRecord(targetRecord._id, newStatus, correctionReason.trim());
      setCorrectionModalVisible(false);

      // Refresh records in expanded view
      if (expandedSessionId) {
        const updated = sessionRecords.map((r) =>
          r._id === targetRecord._id ? { ...r, status: newStatus } : r
        );
        setSessionRecords(updated);
      }
      // Refresh session counts
      loadClassesAndSessions();
      Alert.alert('Audit Logged', 'Attendance record corrected successfully with timestamped audit trail.');
    } catch (e: any) {
      setCorrectionError(e.message || 'Failed to update record.');
    } finally {
      setCorrecting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="History & Audit Trail" subtitle="Attendance Sessions & Corrections" showBack />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadClassesAndSessions();
            }}
          />
        }
      >
        {/* Class Filter Horizontal Scroll */}
        <Text style={styles.filterTitle}>Select Course Class</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classChipsRow}>
          {classes.map((cls) => (
            <TouchableOpacity
              key={cls._id}
              style={[
                styles.classChip,
                selectedClassId === cls._id ? styles.classChipActive : null,
              ]}
              onPress={() => {
                setSelectedClassId(cls._id);
                setExpandedSessionId(null);
              }}
            >
              <Text
                style={[
                  styles.classChipText,
                  selectedClassId === cls._id ? styles.classChipTextActive : null,
                ]}
              >
                {cls.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionHeader}>Conducted Sessions ({sessions.length})</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.navyPrimary} style={{ margin: 30 }} />
        ) : sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Sessions Recorded</Text>
            <Text style={styles.emptyDesc}>
              No attendance logs found for this class. Submit daily attendance to view records.
            </Text>
          </View>
        ) : (
          sessions.map((s) => {
            const isExpanded = expandedSessionId === s._id;
            const dateStr = new Date(s.sessionDate).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <View key={s._id} style={styles.sessionCard}>
                <TouchableOpacity
                  style={styles.sessionCardHeader}
                  onPress={() => toggleExpandSession(s)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sessionTitleBox}>
                    <Text style={styles.sessionDate}>{dateStr}</Text>
                    <Text style={styles.sessionSubject}>{s.subject}</Text>
                    {s.status === 'corrected' && (
                      <View style={styles.correctedPill}>
                        <Text style={styles.correctedPillText}>Audited / Corrected</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.headerRight}>
                    <View style={styles.countsPills}>
                      <Badge status="present" label={`P: ${s.presentCount}`} size="sm" />
                      <Badge status="late" label={`L: ${s.lateCount}`} size="sm" />
                      <Badge status="absent" label={`A: ${s.absentCount}`} size="sm" />
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {/* Expanded Student Records */}
                {isExpanded && (
                  <View style={styles.expandedSection}>
                    <Text style={styles.recordsHeader}>Student Roster for this Session:</Text>
                    {loadingRecords ? (
                      <ActivityIndicator size="small" color={Colors.navyPrimary} style={{ margin: 15 }} />
                    ) : sessionRecords.length === 0 ? (
                      <Text style={styles.noRecordsText}>No individual records found.</Text>
                    ) : (
                      sessionRecords.map((rec) => {
                        const studentName =
                          typeof rec.student === 'object' ? (rec.student as any).name : 'Student';
                        const studentUSN =
                          typeof rec.student === 'object' ? (rec.student as any).studentId : '';

                        return (
                          <View key={rec._id} style={styles.recordRow}>
                            <View style={styles.recordStudentInfo}>
                              <Text style={styles.recName}>{studentName}</Text>
                              <Text style={styles.recUSN}>{studentUSN}</Text>
                            </View>
                            <Badge status={rec.status} size="sm" />

                            <TouchableOpacity
                              style={styles.correctBtn}
                              onPress={() => openCorrectionModal(rec)}
                            >
                              <Ionicons name="create-outline" size={14} color={Colors.navyPrimary} />
                              <Text style={styles.correctBtnText}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal: Authorized Attendance Correction */}
      <Modal
        visible={correctionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCorrectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Authorized Attendance Correction</Text>
              <TouchableOpacity onPress={() => setCorrectionModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Corrections are permanently logged with your user signature, timestamp and stated reason.
            </Text>

            {correctionError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{correctionError}</Text>
              </View>
            ) : null}

            {/* Status Selector */}
            <Text style={styles.fieldLabel}>New Attendance Status</Text>
            <View style={styles.statusSelectRow}>
              {(['present', 'late', 'absent'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.statusChoiceBtn,
                    newStatus === st ? styles.statusChoiceActive : null,
                  ]}
                  onPress={() => setNewStatus(st)}
                >
                  <Text
                    style={[
                      styles.statusChoiceText,
                      newStatus === st ? styles.statusChoiceTextActive : null,
                    ]}
                  >
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Mandatory Reason for Audit *"
              placeholder="e.g. Student provided approved NSS duty slip or medical certificate"
              value={correctionReason}
              onChangeText={setCorrectionReason}
              multiline
              numberOfLines={3}
              style={{ minHeight: 70 }}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setCorrectionModalVisible(false)}
                style={{ flex: 1, marginRight: 10 }}
              />
              <Button
                title="Apply & Audit"
                variant="primary"
                loading={correcting}
                onPress={handleApplyCorrection}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  classChipsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  classChip: {
    paddingVertical: 7,
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
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  sessionCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
    overflow: 'hidden',
    ...Shadows.small,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  sessionTitleBox: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sessionSubject: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  correctedPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  correctedPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.warning,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  countsPills: {
    flexDirection: 'row',
    gap: 4,
  },
  expandedSection: {
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  recordsHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  recordStudentInfo: {
    flex: 1,
  },
  recName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  recUSN: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  correctBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.navySoft,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  correctBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.navyPrimary,
  },
  noRecordsText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    padding: 10,
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
    fontSize: 15,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statusSelectRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusChoiceActive: {
    backgroundColor: Colors.navyPrimary,
    borderColor: Colors.navyPrimary,
  },
  statusChoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  statusChoiceTextActive: {
    color: Colors.white,
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: 14,
    paddingBottom: 16,
  },
});
