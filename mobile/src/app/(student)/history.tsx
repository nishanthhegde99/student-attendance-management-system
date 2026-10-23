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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi } from '../../api/attendanceApi';
import { AttendanceRecordItem, AttendanceStatus } from '../../types';
import { Header } from '../../components/common/Header';
import { Badge } from '../../components/common/Badge';

export default function StudentHistoryScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [filter, setFilter] = useState<'all' | AttendanceStatus>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      const targetId = user?.linkedStudentId || 'me';
      const res = await attendanceApi.getStudentAttendance(String(targetId));
      setRecords(res.records || []);
    } catch (e) {
      console.warn('[StudentHistory error]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const filteredRecords = records.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Attendance History" subtitle="Session Log & Status Audit" showBack />
      
      {/* Status Filter Chips */}
      <View style={styles.filterRow}>
        {(['all', 'present', 'late', 'absent'] as const).map((st) => (
          <TouchableOpacity
            key={st}
            style={[
              styles.filterPill,
              filter === st ? styles.filterPillActive : null,
            ]}
            onPress={() => setFilter(st)}
          >
            <Text
              style={[
                styles.filterText,
                filter === st ? styles.filterTextActive : null,
              ]}
            >
              {st.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadHistory();
            }}
          />
        }
      >
        <Text style={styles.countText}>Total Sessions: {filteredRecords.length}</Text>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.navyPrimary} style={{ margin: 30 }} />
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="documents-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Entries Found</Text>
            <Text style={styles.emptyDesc}>No attendance records match your active filter.</Text>
          </View>
        ) : (
          filteredRecords.map((r) => {
            const dateStr = new Date(r.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            const subject =
              typeof r.session === 'object' && r.session
                ? (r.session as any).subject
                : 'Subject Lecture';

            const hasCorrection = r.correctionHistory && r.correctionHistory.length > 0;

            return (
              <View key={r._id} style={styles.recordCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>{dateStr}</Text>
                  <Badge status={r.status} size="sm" />
                </View>

                <Text style={styles.subjectText}>{subject}</Text>

                {r.remarks ? (
                  <View style={styles.remarksRow}>
                    <Ionicons name="chatbubble-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.remarksText}>{r.remarks}</Text>
                  </View>
                ) : null}

                {hasCorrection && (
                  <View style={styles.auditBox}>
                    <Ionicons name="shield-checkmark" size={14} color={Colors.navyPrimary} />
                    <Text style={styles.auditText}>
                      Audited by Faculty: Reason — "{r.correctionHistory[0].reason}"
                    </Text>
                  </View>
                )}
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
  filterRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: Colors.navyPrimary,
    borderColor: Colors.navyPrimary,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 18,
    paddingBottom: 36,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 12,
  },
  recordCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
    ...Shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subjectText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  remarksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  remarksText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  auditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navySoft,
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  auditText: {
    fontSize: 11,
    color: Colors.navyPrimary,
    fontWeight: '600',
    flex: 1,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
