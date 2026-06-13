import axios from "axios";
import { useToast } from "@/composables/useToast";

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipErrorToast?: boolean;
  }
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const skipErrorToast = error.config?.skipErrorToast;

    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
    }

    if (!skipErrorToast && typeof window !== 'undefined') {
      const statusCode = error.response?.status;
      let message = error.response?.data?.message || error.message || 'An unexpected error occurred';
      
      // Basic mappings
      if (statusCode === 401) message = 'Please log in to continue';
      else if (statusCode === 403) message = 'You do not have permission to do this';
      else if (statusCode === 500) message = 'Server error. Please try again later';
      
      const { addToast } = useToast();
      addToast(message, 'error');
    }

    return Promise.reject(error);
  },
);

export default httpClient;
