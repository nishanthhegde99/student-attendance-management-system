import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'teacher' || user.role === 'admin') {
        router.replace('/(teacher)/dashboard');
      } else {
        router.replace('/(student)/dashboard');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const autoFillTeacher = () => {
    setEmail('teacher@college.edu');
    setPassword('Password123!');
    setErrorMessage('');
  };

  const autoFillStudent = () => {
    setEmail('student@college.edu');
    setPassword('Password123!');
    setErrorMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Portal Login" subtitle="Student Attendance System" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSubtitle}>
              Access your class management or view attendance history
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Input
              label="College Email"
              placeholder="e.g. teacher@college.edu"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color={Colors.textMuted} />}
            />

            <Input
              label="Password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              isPassword
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />}
            />

            <Button
              title="Sign In"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleLogin}
              style={styles.loginBtn}
            />

            {/* Quick Demo Credentials */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>Quick Demo Credentials</Text>
              <View style={styles.demoRow}>
                <TouchableOpacity
                  style={[styles.demoPill, styles.demoTeacher]}
                  onPress={autoFillTeacher}
                  activeOpacity={0.7}
                >
                  <Ionicons name="briefcase-outline" size={14} color={Colors.navyPrimary} />
                  <Text style={styles.demoTeacherText}>Teacher Demo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoPill, styles.demoStudent]}
                  onPress={autoFillStudent}
                  activeOpacity={0.7}
                >
                  <Ionicons name="school-outline" size={14} color={Colors.present} />
                  <Text style={styles.demoStudentText}>Student Demo</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerPrompt}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.footerLink}>Register Here</Text>
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
    justifyContent: 'center',
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
    marginBottom: 20,
    lineHeight: 20,
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
  loginBtn: {
    marginTop: 8,
    marginBottom: 16,
  },
  demoSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
  },
  demoTeacher: {
    backgroundColor: Colors.navySoft,
    borderColor: '#BFDBFE',
  },
  demoTeacherText: {
    fontSize: 12,
    color: Colors.navyPrimary,
    fontWeight: '600',
  },
  demoStudent: {
    backgroundColor: Colors.presentLight,
    borderColor: Colors.presentBorder,
  },
  demoStudentText: {
    fontSize: 12,
    color: Colors.present,
    fontWeight: '600',
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
