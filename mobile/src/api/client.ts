import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../utils/storage';

// Determine default API base URL based on platform
const getDefaultBaseUrl = () => {
  // If defined in environment, use it
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Android emulator routes host machine via 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001/api';
  }

  // iOS Simulator or Web uses localhost
  return 'http://localhost:5001/api';
};

export const API_BASE_URL = getDefaultBaseUrl();

console.log(`[API Client] Configured base URL: ${API_BASE_URL}`);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[API Client] Error retrieving token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network request failed. Please check your backend connection.';
    return Promise.reject(new Error(message));
  }
);
