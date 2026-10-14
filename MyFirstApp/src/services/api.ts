import axios, { create, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { AuthService } from '@/services/auth';
import { AuthTokens } from '@/types';

// Default backend host:
// - Web / iOS simulator: http://localhost:8000/api/v1
// - Android Emulator: http://10.0.2.2:8000/api/v1
const DEFAULT_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});

let currentApiUrl = DEFAULT_BASE_URL;

export const setApiBaseUrl = (url: string) => {
  currentApiUrl = url;
  apiClient.defaults.baseURL = url;
};

export const getApiBaseUrl = () => currentApiUrl;

export const apiClient: AxiosInstance = create({
  baseURL: currentApiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT access token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AuthService.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to attach auth token to request', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: automatically refresh token on 401
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AuthService.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const res = await axios.post(`${currentApiUrl}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newTokens: AuthTokens = {
          accessToken: res.data.access_token,
          refreshToken: res.data.refresh_token,
        };

        await AuthService.saveTokens(newTokens);
        processQueue(null, newTokens.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await AuthService.clearTokens();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Strongly typed API endpoints

export const authApi = {
  async register(payload: { email: string; username: string; password: string; full_name?: string }) {
    const res = await apiClient.post('/auth/register', payload);
    return res.data;
  },

  async login(payload: { username_or_email: string; password: string }) {
    const res = await apiClient.post('/auth/login', payload);
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  async updateProfile(payload: { full_name?: string; username?: string; avatar_url?: string }) {
    const res = await apiClient.put('/auth/me', payload);
    return res.data;
  },
};

export const tasksApi = {
  async list(params?: {
    status?: string;
    category?: string;
    priority?: string;
    due_date?: string;
    search?: string;
  }) {
    const res = await apiClient.get('/tasks/', { params });
    return res.data;
  },

  async create(data: {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
    due_date?: string;
    due_time?: string;
    reminder_time?: string;
    estimated_minutes?: number;
    subtasks?: { id?: string; title: string; completed?: boolean }[];
  }) {
    const res = await apiClient.post('/tasks/', data);
    return res.data;
  },

  async update(id: number, data: Partial<{
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    due_date: string;
    due_time: string;
    subtasks: { id: string; title: string; completed: boolean }[];
  }>) {
    const res = await apiClient.put(`/tasks/${id}`, data);
    return res.data;
  },

  async delete(id: number) {
    await apiClient.delete(`/tasks/${id}`);
  },

  async toggle(id: number) {
    const res = await apiClient.post(`/tasks/${id}/toggle`);
    return res.data;
  },

  async duplicate(id: number) {
    const res = await apiClient.post(`/tasks/${id}/duplicate`);
    return res.data;
  },

  async toggleSubtask(taskId: number, subtaskId: string) {
    const res = await apiClient.post(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
    return res.data;
  },
};

export const roadmapsApi = {
  async list() {
    const res = await apiClient.get('/roadmaps/');
    return res.data;
  },

  async get(slug: string) {
    const res = await apiClient.get(`/roadmaps/${slug}`);
    return res.data;
  },

  async toggleTopic(slug: string, topicId: string, completed?: boolean) {
    const res = await apiClient.post(`/roadmaps/${slug}/topics/${topicId}/toggle`, {
      topic_id: topicId,
      completed,
    });
    return res.data;
  },
};

export const sessionsApi = {
  async list() {
    const res = await apiClient.get('/sessions/');
    return res.data;
  },

  async record(data: {
    duration_minutes: number;
    session_mode: string;
    language_tag: string;
    task_id?: number;
    notes?: string;
  }) {
    const res = await apiClient.post('/sessions/', data);
    return res.data;
  },

  async getStats() {
    const res = await apiClient.get('/sessions/stats');
    return res.data;
  },
};

export const checklistApi = {
  async list(date?: string) {
    const res = await apiClient.get('/checklist/', { params: { date } });
    return res.data;
  },

  async create(data: { item_text: string; date: string; category?: string }) {
    const res = await apiClient.post('/checklist/', data);
    return res.data;
  },

  async toggle(id: number) {
    const res = await apiClient.post(`/checklist/${id}/toggle`);
    return res.data;
  },

  async delete(id: number) {
    await apiClient.delete(`/checklist/${id}`);
  },
};

export const syncApi = {
  async bulkSync(payload: {
    tasks: unknown[];
    study_sessions: unknown[];
    checklist_items: unknown[];
    completed_topics: { roadmap_slug: string; topic_id: string }[];
  }) {
    const res = await apiClient.post('/sync/', payload);
    return res.data;
  },
};

export const healthApi = {
  async check(): Promise<boolean> {
    try {
      const res = await axios.get(`${currentApiUrl.replace('/api/v1', '')}/health`, { timeout: 3000 });
      return res.status === 200;
    } catch {
      return false;
    }
  },
};
