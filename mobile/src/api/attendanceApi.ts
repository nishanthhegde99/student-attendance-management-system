import { apiClient, API_BASE_URL } from './client';
import {
  AttendanceRecordItem,
  AttendanceSessionItem,
  AttendanceStats,
  AttendanceStatus,
  ClassReport
} from '../types';

export interface SubmitAttendancePayload {
  classId: string;
  sessionDate: string;
  subject?: string;
  remarks?: string;
  records: Array<{
    studentId: string;
    status: AttendanceStatus;
    remarks?: string;
  }>;
}

export const attendanceApi = {
  submitAttendance: async (payload: SubmitAttendancePayload): Promise<{ success: boolean; session: any }> => {
    const res = await apiClient.post('/attendance/submit', payload);
    return res.data;
  },

  getAttendanceByDate: async (
    classId: string,
    date: string,
    subject?: string
  ): Promise<{
    success: boolean;
    sessionExists: boolean;
    session: AttendanceSessionItem | null;
    records: AttendanceRecordItem[];
  }> => {
    const res = await apiClient.get('/attendance/by-date', {
      params: { classId, date, subject }
    });
    return res.data;
  },

  correctRecord: async (
    recordId: string,
    newStatus: AttendanceStatus,
    reason: string
  ): Promise<{ success: boolean; record: AttendanceRecordItem }> => {
    const res = await apiClient.put(`/attendance/record/${recordId}/correct`, {
      newStatus,
      reason
    });
    return res.data;
  },

  getStudentAttendance: async (
    studentId: string
  ): Promise<{
    success: boolean;
    student: any;
    stats: AttendanceStats;
    records: AttendanceRecordItem[];
  }> => {
    const res = await apiClient.get(`/attendance/student/${studentId}`);
    return res.data;
  },

  getClassReport: async (
    classId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ClassReport & { success: boolean }> => {
    const res = await apiClient.get(`/attendance/class/${classId}/report`, {
      params: { startDate, endDate }
    });
    return res.data;
  },

  getMonthlyReport: async (classId?: string): Promise<{ success: boolean; report: any[] }> => {
    const res = await apiClient.get('/attendance/reports/monthly', {
      params: { classId }
    });
    return res.data;
  },

  getExportCsvUrl: (classId: string): string => {
    return `${API_BASE_URL}/attendance/class/${classId}/export/csv`;
  }
};
