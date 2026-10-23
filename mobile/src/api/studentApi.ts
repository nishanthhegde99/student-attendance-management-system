import { apiClient } from './client';
import { Student } from '../types';

export interface CreateStudentPayload {
  studentId: string;
  name: string;
  email: string;
  rollNumber: string;
  classId: string;
  phone?: string;
  guardianPhone?: string;
  gender?: 'Male' | 'Female' | 'Other';
}

export const studentApi = {
  getStudents: async (classId?: string, search?: string): Promise<{ success: boolean; students: Student[] }> => {
    const params: any = {};
    if (classId) params.classId = classId;
    if (search) params.search = search;
    const res = await apiClient.get<{ success: boolean; students: Student[] }>('/students', { params });
    return res.data;
  },

  getStudentById: async (id: string): Promise<{ success: boolean; student: Student }> => {
    const res = await apiClient.get<{ success: boolean; student: Student }>(`/students/${id}`);
    return res.data;
  },

  createStudent: async (data: CreateStudentPayload): Promise<{ success: boolean; student: Student }> => {
    const res = await apiClient.post<{ success: boolean; student: Student }>('/students', data);
    return res.data;
  },

  updateStudent: async (id: string, data: Partial<CreateStudentPayload>): Promise<{ success: boolean; student: Student }> => {
    const res = await apiClient.put<{ success: boolean; student: Student }>(`/students/${id}`, data);
    return res.data;
  },

  deleteStudent: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/students/${id}`);
    return res.data;
  }
};
