import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { API_BASE_URL } from '../../api/client';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out from this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Student Profile" subtitle="Account & Academic Records" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'S').charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.userName}>{user?.name || 'Student'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>ENROLLED STUDENT</Text>
          </View>
        </View>

        {/* Academic Details */}
        <Text style={styles.sectionTitle}>Academic Identification</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{user?.department || 'MCA'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Student Record Link</Text>
            <Text style={styles.infoValue}>
              {user?.linkedStudentId ? 'Verified Active' : 'Unlinked'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Attendance Permissions</Text>
            <Text style={styles.infoValue}>Read-Only Access</Text>
          </View>
        </View>

        {/* Server Endpoint */}
        <Text style={styles.sectionTitle}>Backend Connection</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>API Server</Text>
            <Text style={styles.infoValueCode} numberOfLines={1}>
              {API_BASE_URL}
            </Text>
          </View>
        </View>

        {/* Sign Out CTA */}
        <Button
          title="Sign Out of Portal"
          variant="danger"
          size="lg"
          loading={loggingOut}
          onPress={handleLogout}
          style={styles.logoutBtn}
          icon={<Ionicons name="log-out-outline" size={20} color={Colors.white} />}
        />

        <Text style={styles.footerNote}>
          Student Attendance Management System • MCA Department
        </Text>
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
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
    ...Shadows.small,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.navyPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: Colors.presentLight,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.presentBorder,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.present,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 18,
    ...Shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoValueCode: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accentBlue,
    maxWidth: 200,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  logoutBtn: {
    marginTop: 10,
    marginBottom: 16,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
  },
});
