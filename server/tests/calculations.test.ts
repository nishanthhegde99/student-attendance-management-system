import { calculateAttendanceStats, LOW_ATTENDANCE_THRESHOLD } from '../src/utils/calculations';

describe('Attendance Calculation Engine', () => {
  test('Handles zero sessions safely without division-by-zero errors', () => {
    const stats = calculateAttendanceStats(0, 0, 0);
    expect(stats.totalSessions).toBe(0);
    expect(stats.attendancePercentage).toBe(0);
    expect(stats.strictPresentPercentage).toBe(0);
    expect(stats.isLowAttendance).toBe(false);
    expect(stats.shortageSessionsNeededFor75).toBe(0);
  });

  test('Matches prompt example: 36 present out of 40 total = 90%', () => {
    // 36 present, 4 absent, 0 late
    const stats = calculateAttendanceStats(36, 4, 0);
    expect(stats.totalSessions).toBe(40);
    expect(stats.presentCount).toBe(36);
    expect(stats.absentCount).toBe(4);
    expect(stats.lateCount).toBe(0);
    expect(stats.attendancePercentage).toBe(90.0);
    expect(stats.isLowAttendance).toBe(false);
  });

  test('Correctly weights Late sessions as 0.5 attendance', () => {
    // 10 total sessions: 7 present, 2 late (2 * 0.5 = 1), 1 absent => effective attended = 8 / 10 = 80%
    const stats = calculateAttendanceStats(7, 1, 2);
    expect(stats.totalSessions).toBe(10);
    expect(stats.effectiveAttended).toBe(8);
    expect(stats.attendancePercentage).toBe(80.0);
    expect(stats.strictPresentPercentage).toBe(70.0);
    expect(stats.isLowAttendance).toBe(false);
  });

  test('Flags low attendance warning when below threshold (75%)', () => {
    // 10 sessions: 6 present, 4 absent => 60% (< 75%)
    const stats = calculateAttendanceStats(6, 4, 0, LOW_ATTENDANCE_THRESHOLD);
    expect(stats.totalSessions).toBe(10);
    expect(stats.attendancePercentage).toBe(60.0);
    expect(stats.isLowAttendance).toBe(true);
    // Needs 6 more consecutive present sessions: (6+6)/(10+6) = 12/16 = 75%
    expect(stats.shortageSessionsNeededFor75).toBe(6);
  });

  test('Consistently handles 100% attendance', () => {
    const stats = calculateAttendanceStats(25, 0, 0);
    expect(stats.totalSessions).toBe(25);
    expect(stats.attendancePercentage).toBe(100.0);
    expect(stats.isLowAttendance).toBe(false);
    expect(stats.shortageSessionsNeededFor75).toBe(0);
  });
});
