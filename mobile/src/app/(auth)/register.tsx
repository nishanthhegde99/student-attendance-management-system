import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [role, setRole] = useState<UserRole>('teacher');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('MCA Department');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all mandatory fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (role === 'student' && !studentId.trim()) {
      setErrorMessage('Please provide your Student ID / Roll Number (e.g. MCA2026001).');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        department: department.trim(),
        studentId: role === 'student' ? studentId.trim() : undefined,
      });

      if (user.role === 'teacher' || user.role === 'admin') {
        router.replace('/(teacher)/dashboard');
      } else {
        router.replace('/(student)/dashboard');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Account Registration" subtitle="Create College Portal Access" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <Text style={styles.formTitle}>Register New Account</Text>
            <Text style={styles.formSubtitle}>Select your primary role in the MCA department</Text>

            {/* Role Selector Pill */}
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'teacher' ? styles.roleButtonActive : null,
                ]}
                onPress={() => setRole('teacher')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={16}
                  color={role === 'teacher' ? Colors.white : Colors.navyPrimary}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === 'teacher' ? styles.roleTextActive : null,
                  ]}
                >
                  Faculty / Teacher
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'student' ? styles.roleButtonActive : null,
                ]}
                onPress={() => setRole('student')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="school-outline"
                  size={16}
                  color={role === 'student' ? Colors.white : Colors.navyPrimary}
                />
                <Text
                  style={[
                    styles.roleText,
                    role === 'student' ? styles.roleTextActive : null,
                  ]}
                >
                  Student
                </Text>
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name *"
              placeholder="e.g. Prof. Ramesh Kumar or Rahul Verma"
              value={name}
              onChangeText={setName}
              leftIcon={<Ionicons name="person-outline" size={18} color={Colors.textMuted} />}
            />

            <Input
              label="College Email *"
              placeholder="e.g. yourname@college.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
            />

            {role === 'student' && (
              <Input
                label="Student ID (USN / Reg No) *"
                placeholder="e.g. MCA2026001"
                value={studentId}
                onChangeText={setStudentId}
                autoCapitalize="characters"
                leftIcon={<Ionicons name="card-outline" size={18} color={Colors.textMuted} />}
              />
            )}

            <Input
              label="Department"
              placeholder="e.g. MCA Department"
              value={department}
              onChangeText={setDepartment}
              leftIcon={<Ionicons name="business-outline" size={18} color={Colors.textMuted} />}
            />

            <Input
              label="Password (min 6 characters) *"
              placeholder="Enter strong password"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />}
            />

            <Input
              label="Confirm Password *"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />}
            />

            <Button
              title="Create Account"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleRegister}
              style={styles.submitBtn}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerPrompt}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
    padding: 20,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.medium,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  roleButtonActive: {
    backgroundColor: Colors.navyPrimary,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.navyPrimary,
  },
  roleTextActive: {
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
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    flex: 1,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerPrompt: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.accentBlue,
    fontWeight: '700',
  },
});
