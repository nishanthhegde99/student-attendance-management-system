/**
 * Attendance Calculation Utility
 * 
 * Standard College Attendance Rules:
 * - Total Counted Sessions = Present + Absent + Late
 * - Present Session = 1.0 weight
 * - Late Session = 0.5 weight (standard academic policy: student attended partially)
 * - Absent Session = 0.0 weight
 * 
 * Formula:
 * Effective Attended = Present + (Late * 0.5)
 * Attendance Percentage = (Effective Attended / Total Counted Sessions) * 100
 * 
 * Division by zero handled safely (returns 0.0%).
 * Low attendance warning threshold: < 75% (MCA College Standard).
 */

export const LOW_ATTENDANCE_THRESHOLD = 75; // 75% university eligibility requirement

export interface AttendanceStats {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  effectiveAttended: number;
  attendancePercentage: number;
  strictPresentPercentage: number;
  isLowAttendance: boolean;
  shortageSessionsNeededFor75: number;
}

export function calculateAttendanceStats(
  present: number,
  absent: number,
  late: number,
  threshold: number = LOW_ATTENDANCE_THRESHOLD
): AttendanceStats {
  const total = present + absent + late;
  
  if (total === 0) {
    return {
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      effectiveAttended: 0,
      attendancePercentage: 0,
      strictPresentPercentage: 0,
      isLowAttendance: false,
      shortageSessionsNeededFor75: 0
    };
  }

  const effectiveAttended = present + late * 0.5;
  const attendancePercentage = Number(((effectiveAttended / total) * 100).toFixed(1));
  const strictPresentPercentage = Number(((present / total) * 100).toFixed(1));
  const isLowAttendance = attendancePercentage < threshold;

  // Calculate sessions needed to reach threshold:
  // (effectiveAttended + X) / (total + X) >= threshold / 100
  // effectiveAttended + X >= (threshold / 100) * total + (threshold / 100) * X
  // X * (1 - threshold/100) >= (threshold/100) * total - effectiveAttended
  let shortageSessionsNeededFor75 = 0;
  if (isLowAttendance) {
    const p = threshold / 100;
    const numerator = p * total - effectiveAttended;
    const denominator = 1 - p;
    shortageSessionsNeededFor75 = Math.max(0, Math.ceil(numerator / denominator));
  }

  return {
    totalSessions: total,
    presentCount: present,
    absentCount: absent,
    lateCount: late,
    effectiveAttended,
    attendancePercentage,
    strictPresentPercentage,
    isLowAttendance,
    shortageSessionsNeededFor75
  };
}
