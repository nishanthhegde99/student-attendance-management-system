import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isTeacher, isStudent, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (isTeacher) {
        router.replace('/(teacher)/dashboard');
      } else if (isStudent) {
        router.replace('/(student)/dashboard');
      }
    }
  }, [isAuthenticated, isTeacher, isStudent, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.navyPrimary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Hero Section */}
        <View style={styles.heroBanner}>
          <View style={styles.iconCircle}>
            <Ionicons name="school" size={44} color={Colors.white} />
          </View>
          <Text style={styles.heroTitle}>MCA Department</Text>
          <Text style={styles.heroSubtitle}>Attendance Management System</Text>
        </View>

        {/* Features Highlight */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionHeader}>System Capabilities</Text>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="finger-print" size={22} color={Colors.accentBlue} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Digital Daily Attendance</Text>
              <Text style={styles.featureDesc}>
                Rapidly mark Present, Absent or Late with duplicate record prevention.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="pie-chart" size={22} color={Colors.present} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Automated Percentage Rules</Text>
              <Text style={styles.featureDesc}>
                Standard academic calculations with 75% low-attendance warning triggers.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="shield-checkmark" size={22} color={Colors.warning} />
            </View>
            <View style={styles.featureTextBox}>
              <Text style={styles.featureTitle}>Audit Trails & Role Security</Text>
              <Text style={styles.featureDesc}>
                Authorized corrections logged securely. Tamper-proof student access.
              </Text>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.actionContainer}>
          <Button
            title="Log In to Portal"
            variant="primary"
            size="lg"
            onPress={() => router.push('/(auth)/login')}
            style={styles.mainBtn}
            icon={<Ionicons name="log-in-outline" size={20} color={Colors.white} />}
          />

          <Button
            title="Create Account"
            variant="outline"
            size="lg"
            onPress={() => router.push('/(auth)/register')}
            style={styles.outlineBtn}
            icon={<Ionicons name="person-add-outline" size={18} color={Colors.navyPrimary} />}
          />
        </View>

        {/* Footer */}
        <Text style={styles.footerNote}>
          Engineered for Android, iOS & Web • React Native & Express
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
  },
  heroBanner: {
    backgroundColor: Colors.navyPrimary,
    paddingTop: 36,
    paddingBottom: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#93C5FD',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  featuresSection: {
    padding: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 12,
    ...Shadows.small,
    alignItems: 'center',
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  actionContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  mainBtn: {
    width: '100%',
  },
  outlineBtn: {
    width: '100%',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
    paddingBottom: 24,
  },
});
