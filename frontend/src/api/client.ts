import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT
client.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap envelope and handle refresh token
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => {
    // Unwrap { data, timestamp, requestId } and return the nested data
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const errorData = error.response?.data;

    // Check if unauthorized and we haven't retried yet
    const isAuthExpired = error.response?.status === 401 || errorData?.errorCode === 'AUTH_EXPIRED';
    
    if (
      isAuthExpired &&
      !originalRequest._retry &&
      useAuthStore.getState().refreshToken
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(client(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        // Make call to refresh endpoint
        // Note: we call axios directly, not client, to prevent recursive interception
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = res.data?.data?.access_token;
        const newRefreshToken = res.data?.data?.refresh_token;

        if (newAccessToken && newRefreshToken) {
          useAuthStore.getState().updateAccessToken(newAccessToken);
          // Set new refresh token too
          useAuthStore.setState({ refreshToken: newRefreshToken });

          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return client(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        return Promise.reject(errorData || { message: 'Session expired' });
      } finally {
        isRefreshing = false;
      }
    }

    // Return standardized error shape
    return Promise.reject(errorData || { message: error.message });
  }
);

// Helper to poll job status
export const pollJob = async (jobId: string, intervalMs = 2000, maxAttempts = 60): Promise<any> => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const res: any = await client.get(`/jobs/${jobId}`);
    if (res.status === 'completed') {
      return res.result;
    }
    if (res.status === 'failed') {
      throw new Error(res.error || 'Job failed');
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }
  throw new Error('Polling timeout exceeded');
};
