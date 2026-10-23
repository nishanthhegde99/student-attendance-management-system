export const LOW_ATTENDANCE_THRESHOLD = 75;

export interface AttendanceStatsClient {
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

export function calculateAttendance(
  present: number,
  absent: number,
  late: number,
  threshold: number = LOW_ATTENDANCE_THRESHOLD
): AttendanceStatsClient {
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
