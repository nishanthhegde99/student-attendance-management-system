export type UserRole = 'teacher' | 'student' | 'admin';
export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
  linkedStudentId?: string;
  studentProfile?: Student;
}

export interface ClassItem {
  _id: string;
  name: string;
  code: string;
  subject: string;
  academicYear: string;
  semester: string;
  roomNumber?: string;
  teacher: {
    _id: string;
    name: string;
    email: string;
    department?: string;
  };
  students: Student[];
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  _id: string;
  studentId: string;
  name: string;
  email: string;
  rollNumber: string;
  class: string | ClassItem;
  phone?: string;
  guardianPhone?: string;
  gender?: string;
}

export interface AttendanceRecordItem {
  _id: string;
  session: string | { _id: string; subject: string; sessionDate: string; remarks?: string };
  student: string | Student;
  class: string | { _id: string; name: string; code: string };
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  correctionHistory: Array<{
    changedBy: { _id: string; name: string; email: string };
    oldStatus: AttendanceStatus;
    newStatus: AttendanceStatus;
    reason: string;
    changedAt: string;
  }>;
}

export interface AttendanceSessionItem {
  _id: string;
  class: string | ClassItem;
  sessionDate: string;
  subject: string;
  teacher: { _id: string; name: string; email: string };
  status: 'submitted' | 'corrected';
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  remarks?: string;
  createdAt: string;
}

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

export interface StudentReportItem {
  student: {
    id: string;
    name: string;
    studentId: string;
    rollNumber: string;
  };
  stats: AttendanceStats;
}

export interface ClassReport {
  class: ClassItem;
  totalSessions: number;
  totalEnrolled: number;
  classAveragePercentage: number;
  lowAttendanceCount: number;
  students: StudentReportItem[];
  sessions: AttendanceSessionItem[];
}
