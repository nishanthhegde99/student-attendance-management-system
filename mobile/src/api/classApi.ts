import { apiClient } from './client';
import { ClassItem } from '../types';

export interface CreateClassPayload {
  name: string;
  code: string;
  subject: string;
  academicYear: string;
  semester: string;
  roomNumber?: string;
}

export const classApi = {
  getClasses: async (): Promise<{ success: boolean; classes: ClassItem[] }> => {
    const res = await apiClient.get<{ success: boolean; classes: ClassItem[] }>('/classes');
    return res.data;
  },

  getClassById: async (id: string): Promise<{ success: boolean; class: ClassItem }> => {
    const res = await apiClient.get<{ success: boolean; class: ClassItem }>(`/classes/${id}`);
    return res.data;
  },

  createClass: async (data: CreateClassPayload): Promise<{ success: boolean; class: ClassItem }> => {
    const res = await apiClient.post<{ success: boolean; class: ClassItem }>('/classes', data);
    return res.data;
  },

  updateClass: async (id: string, data: Partial<CreateClassPayload>): Promise<{ success: boolean; class: ClassItem }> => {
    const res = await apiClient.put<{ success: boolean; class: ClassItem }>(`/classes/${id}`, data);
    return res.data;
  },

  deleteClass: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/classes/${id}`);
    return res.data;
  }
};
