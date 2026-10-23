import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../../theme/colors';
import { studentApi } from '../../../api/studentApi';
import { classApi } from '../../../api/classApi';
import { ClassItem } from '../../../types';
import { Header } from '../../../components/common/Header';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

export default function AddStudentScreen() {
  const router = useRouter();
  const { preselectedClassId } = useLocalSearchParams<{ preselectedClassId?: string }>();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(preselectedClassId || '');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classApi.getClasses();
        setClasses(res.classes || []);
        if (!selectedClassId && res.classes.length > 0) {
          setSelectedClassId(res.classes[0]._id);
        }
      } catch (e) {
        console.warn('[AddStudent fetchClasses error]', e);
      }
    };
    fetchClasses();
  }, []);

  const handleSaveStudent = async () => {
    if (!name.trim() || !studentId.trim() || !email.trim() || !rollNumber.trim() || !selectedClassId) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await studentApi.createStudent({
        studentId: studentId.trim().toUpperCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rollNumber: rollNumber.trim(),
        classId: selectedClassId,
        phone: phone.trim() || undefined,
        guardianPhone: guardianPhone.trim() || undefined,
        gender,
      });

      Alert.alert('Success', `Student ${name} successfully enrolled in class!`, [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to create and enroll student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Enroll New Student" subtitle="MCA Student Registration" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <Text style={styles.formTitle}>Student Profile & Enrollment</Text>
            <Text style={styles.formSubtitle}>
              Create student record and map to course roster
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Class Selector */}
            <Text style={styles.fieldLabel}>Select Class *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classPickerRow}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls._id}
                  style={[
                    styles.classPickItem,
                    selectedClassId === cls._id ? styles.classPickItemActive : null,
                  ]}
                  onPress={() => setSelectedClassId(cls._id)}
                >
                  <Text
                    style={[
                      styles.classPickText,
                      selectedClassId === cls._id ? styles.classPickTextActive : null,
                    ]}
                  >
                    {cls.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input
              label="Student Full Name *"
              placeholder="e.g. Rahul Verma"
              value={name}
              onChangeText={setName}
              leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textMuted} />}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Student USN / Reg ID *"
                  placeholder="e.g. MCA2026001"
                  value={studentId}
                  onChangeText={setStudentId}
                  autoCapitalize="characters"
                  leftIcon={<Ionicons name="card-outline" size={18} color={Colors.textMuted} />}
                />
              </View>
              <View style={{ width: 110 }}>
                <Input
                  label="Roll No *"
                  placeholder="e.g. 01"
                  value={rollNumber}
                  onChangeText={setRollNumber}
                  keyboardType="numeric"
                  leftIcon={<Ionicons name="barcode-outline" size={18} color={Colors.textMuted} />}
                />
              </View>
            </View>

            <Input
              label="College Email *"
              placeholder="e.g. rahul@college.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Phone Number"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  leftIcon={<Ionicons name="call-outline" size={18} color={Colors.textMuted} />}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Parent Phone"
                  placeholder="+91 91234 56789"
                  value={guardianPhone}
                  onChangeText={setGuardianPhone}
                  keyboardType="phone-pad"
                  leftIcon={<Ionicons name="shield-outline" size={18} color={Colors.textMuted} />}
                />
              </View>
            </View>

            {/* Gender Selection */}
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {(['Male', 'Female', 'Other'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderButton,
                    gender === g ? styles.genderButtonActive : null,
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      gender === g ? styles.genderTextActive : null,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Save & Enroll Student"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSaveStudent}
              style={{ marginTop: 14 }}
              icon={<Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.navyPrimary,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 18,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.medium,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  classPickerRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  classPickItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  classPickItemActive: {
    backgroundColor: Colors.navyPrimary,
    borderColor: Colors.navyPrimary,
  },
  classPickText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  classPickTextActive: {
    color: Colors.white,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderButtonActive: {
    backgroundColor: Colors.navyPrimary,
    borderColor: Colors.navyPrimary,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  genderTextActive: {
    color: Colors.white,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    flex: 1,
  },
});
