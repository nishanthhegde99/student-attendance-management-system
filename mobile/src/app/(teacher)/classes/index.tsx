import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../theme/colors';
import { classApi } from '../../../api/classApi';
import { ClassItem } from '../../../types';
import { Header } from '../../../components/common/Header';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

export default function ClassManagementScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Class Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('Semester 4');
  const [roomNumber, setRoomNumber] = useState('Room 302');
  const [modalError, setModalError] = useState('');

  const loadClasses = async () => {
    try {
      const res = await classApi.getClasses();
      setClasses(res.classes || []);
    } catch (e: any) {
      console.warn('[ClassManagement load error]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCreateClass = async () => {
    if (!className.trim() || !classCode.trim() || !subject.trim()) {
      setModalError('Please fill in Class Name, Code, and Subject.');
      return;
    }

    setCreating(true);
    setModalError('');
    try {
      await classApi.createClass({
        name: className.trim(),
        code: classCode.trim().toUpperCase(),
        subject: subject.trim(),
        semester: semester.trim(),
        academicYear: '2025-2026',
        roomNumber: roomNumber.trim(),
      });
      setModalVisible(false);
      // Reset form
      setClassName('');
      setClassCode('');
      setSubject('');
      loadClasses();
    } catch (error: any) {
      setModalError(error.message || 'Failed to create class.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Class Management"
        subtitle="MCA Course Sections & Enrollments"
        showBack
        rightAction={{
          icon: 'add-circle-outline',
          onPress: () => {
            setModalError('');
            setModalVisible(true);
          },
        }}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadClasses(); }} />
        }
      >
        <View style={styles.actionBar}>
          <Text style={styles.sectionTitle}>Course Sections ({classes.length})</Text>
          <TouchableOpacity
            style={styles.addBtnSmall}
            onPress={() => {
              setModalError('');
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={16} color={Colors.white} />
            <Text style={styles.addBtnText}>New Class</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.navyPrimary} style={{ margin: 40 }} />
        ) : classes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No Classes Found</Text>
            <Text style={styles.emptyDesc}>Tap "+ New Class" to create your first course section.</Text>
          </View>
        ) : (
          classes.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.classCard}
              onPress={() => router.push(`/(teacher)/classes/${item._id}`)}
              activeOpacity={0.75}
            >
              <View style={styles.cardHeader}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>{item.code}</Text>
                </View>
                <Text style={styles.semesterTag}>{item.semester}</Text>
              </View>

              <Text style={styles.className}>{item.name}</Text>
              <Text style={styles.subjectName}>{item.subject}</Text>

              <View style={styles.cardMetaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{item.roomNumber || 'Main Hall'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{item.students?.length || 0} Students</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.navyPrimary} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal: Create Class */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Course Class</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {modalError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{modalError}</Text>
              </View>
            ) : null}

            <Input
              label="Class Name *"
              placeholder="e.g. MCA 2nd Year - Section A"
              value={className}
              onChangeText={setClassName}
            />

            <Input
              label="Class Code *"
              placeholder="e.g. MCA-DS-2026"
              value={classCode}
              onChangeText={setClassCode}
              autoCapitalize="characters"
            />

            <Input
              label="Subject / Course *"
              placeholder="e.g. Distributed Systems & Microservices"
              value={subject}
              onChangeText={setSubject}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Semester"
                  placeholder="e.g. Semester 4"
                  value={semester}
                  onChangeText={setSemester}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Room / Lab"
                  placeholder="e.g. Lab 201"
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, marginRight: 10 }}
              />
              <Button
                title="Create Class"
                variant="primary"
                loading={creating}
                onPress={handleCreateClass}
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
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  addBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.navyPrimary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeBadge: {
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
  semesterTag: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subjectName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
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
  rowInputs: {
    flexDirection: 'row',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 12,
    paddingBottom: 20,
  },
});
