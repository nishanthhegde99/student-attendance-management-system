import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { API_BASE_URL } from '../../api/client';

export default function TeacherProfileScreen() {
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
      <Header title="Faculty Profile" subtitle="Account & System Settings" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || 'T').charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.userName}>{user?.name || 'Faculty Member'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>FACULTY / TEACHER</Text>
          </View>
        </View>

        {/* Academic Details */}
        <Text style={styles.sectionTitle}>Academic Information</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department</Text>
            <Text style={styles.infoValue}>{user?.department || 'MCA'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role Permissions</Text>
            <Text style={styles.infoValue}>Full Teacher Access</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Audit Trail Signing</Text>
            <Text style={styles.infoValue}>Enabled (Cryptographic)</Text>
          </View>
        </View>

        {/* Developer & Network Settings */}
        <Text style={styles.sectionTitle}>Network Configuration</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Active API Base URL</Text>
            <Text style={styles.infoValueCode} numberOfLines={1}>
              {API_BASE_URL}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cross-Platform Mode</Text>
            <Text style={styles.infoValue}>macOS & Windows Compatible</Text>
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
    backgroundColor: Colors.navySoft,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 10,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.navyPrimary,
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
