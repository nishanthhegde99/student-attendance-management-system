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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../theme/colors';
import { studentApi } from '../../../api/studentApi';
import { classApi } from '../../../api/classApi';
import { Student, ClassItem } from '../../../types';
import { Header } from '../../../components/common/Header';
import { Input } from '../../../components/common/Input';
import { ConfirmModal } from '../../../components/common/ConfirmModal';

export default function StudentListScreen() {
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [classRes, studentRes] = await Promise.all([
        classApi.getClasses(),
        studentApi.getStudents(selectedClassId || undefined, searchQuery || undefined),
      ]);
      setClasses(classRes.classes || []);
      setStudents(studentRes.students || []);
    } catch (e) {
      console.warn('[StudentList error]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  const handleSearch = () => {
    loadData();
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      await studentApi.deleteStudent(studentToDelete._id);
      setDeleteModalVisible(false);
      setStudentToDelete(null);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Student Directory"
        subtitle="MCA Enrolled Student Profiles"
        showBack
        rightAction={{
          icon: 'person-add-outline',
          onPress: () => router.push('/(teacher)/students/new'),
        }}
      />
      <View style={styles.searchBarContainer}>
        <Input
          placeholder="Search by Name, Roll No or USN..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          leftIcon={<Ionicons name="search-outline" size={18} color={Colors.textMuted} />}
          style={{ marginBottom: 0 }}
        />
      </View>

      {/* Class Horizontal Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.classFilterContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterPill,
            selectedClassId === '' ? styles.filterPillActive : null,
          ]}
          onPress={() => setSelectedClassId('')}
        >
          <Text
            style={[
              styles.filterText,
              selectedClassId === '' ? styles.filterTextActive : null,
            ]}
          >
            All Classes
          </Text>
        </TouchableOpacity>
        {classes.map((c) => (
          <TouchableOpacity
            key={c._id}
            style={[
              styles.filterPill,
              selectedClassId === c._id ? styles.filterPillActive : null,
            ]}
            onPress={() => setSelectedClassId(c._id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedClassId === c._id ? styles.filterTextActive : null,
              ]}
            >
              {c.code}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
      >
        <View style={styles.countRow}>
          <Text style={styles.countText}>Total Students: {students.length}</Text>
          <TouchableOpacity
            style={styles.newStudentBtn}
            onPress={() => router.push('/(teacher)/students/new')}
          >
            <Ionicons name="add" size={16} color={Colors.white} />
            <Text style={styles.newStudentText}>Add Student</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.navyPrimary} style={{ margin: 40 }} />
        ) : students.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptyDesc}>Try adjusting your search criteria or add new students.</Text>
          </View>
        ) : (
          students.map((student) => (
            <View key={student._id} style={styles.studentCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.rollBadge}>{student.rollNumber}</Text>
              </View>

              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentUSN}>USN: {student.studentId}</Text>
                <Text style={styles.studentEmail}>{student.email}</Text>
                {student.class && typeof student.class === 'object' && (
                  <View style={styles.classTag}>
                    <Text style={styles.classTagText}>
                      {(student.class as any).code || (student.class as any).name}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.deleteIconBtn}
                onPress={() => {
                  setStudentToDelete(student);
                  setDeleteModalVisible(true);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete Student Record"
        message={`Are you sure you want to remove "${studentToDelete?.name}" (${studentToDelete?.studentId}) from the system?`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setStudentToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.navyPrimary,
  },
  searchBarContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  classFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: Colors.navyPrimary,
    borderColor: Colors.navyPrimary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
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
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  newStudentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyPrimary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  newStudentText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
    ...Shadows.small,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rollBadge: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.navyPrimary,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  studentUSN: {
    fontSize: 12,
    color: Colors.accentBlue,
    fontWeight: '600',
    marginTop: 2,
  },
  studentEmail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  classTag: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  classTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.navyPrimary,
  },
  deleteIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
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
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
