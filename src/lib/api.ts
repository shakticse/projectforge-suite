// import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
// import React, { useEffect, useMemo, useState } from "react";
// import { createRoot } from "react-dom/client";
// import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
// import { create } from "zustand";

// // Types for API responses
// export interface ApiResponse<T = any> {
//   data: T;
//   message?: string;
//   success: boolean;
// }

// export interface ApiError {
//   message: string;
//   code?: string;
//   details?: any;
// }

// export class User {
//     email: string;
//     password: string;

//     constructor(email: string, password: string) {
//         this.email = email;
//         this.password = password;
//     }
// }

// // ---------- Types ----------
// export type AuthUser = {
//   id: string;
//   email: string;
//   firstname: string;
//   lastname: string;
// };

// type Tokens = {
//   accessToken: string | null;
//   refreshToken: string | null;
// };

// type AuthState = Tokens & {
//   user: AuthUser | null;
//   isAuthenticated: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => void;
//   setTokens: (t: Tokens) => void;
//   setUser: (u: AuthUser | null) => void;
//   hydrate: () => void;
// };

// // ---------- Storage Keys ----------
// const LS_ACCESS = "app.accessToken";
// const LS_REFRESH = "app.refreshToken";
// const LS_USER = "app.user";

// // ---------- Zustand Store ----------
// export const useAuth = create<AuthState>((set, get) => ({
//   accessToken: null,
//   refreshToken: null,
//   user: null,
//   isAuthenticated: false,

//   setTokens: ({ accessToken, refreshToken }) => {
//     if (accessToken) localStorage.setItem(LS_ACCESS, accessToken); else localStorage.removeItem(LS_ACCESS);
//     if (refreshToken) localStorage.setItem(LS_REFRESH, refreshToken); else localStorage.removeItem(LS_REFRESH);
//     set({ accessToken, refreshToken, isAuthenticated: !!accessToken });
//   },

//   setUser: (user) => {
//     if (user) localStorage.setItem(LS_USER, JSON.stringify(user)); else localStorage.removeItem(LS_USER);
//     set({ user });
//   },

//   hydrate: () => {
//     const accessToken = localStorage.getItem(LS_ACCESS);
//     const refreshToken = localStorage.getItem(LS_REFRESH);
//     const userRaw = localStorage.getItem(LS_USER);
//     const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
//     set({ accessToken, refreshToken, user, isAuthenticated: !!accessToken });
//   },

//   login: async (email: string, password: string) => {
//     let api = axios.create({
//       baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/',
//       timeout: 1000000,
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });
//     var userCreds = new User (email, password);
//     const res = await api.post("/api/login", userCreds);
//     const { accessToken, refreshToken, user } = res.data as { accessToken: string; refreshToken: string; user: AuthUser };
//     get().setTokens({ accessToken, refreshToken });
//     get().setUser(user);
//   },

//   logout: () => {
//     get().setTokens({ accessToken: null, refreshToken: null });
//     get().setUser(null);
//   },
// }));

// class ApiService {
//   private api: AxiosInstance;

//   constructor() {
//     this.api = axios.create({
//       baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/',
//       timeout: 1000000,
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     this.setupInterceptors();
//   }

//     // ---------- Token Attachment & Refresh Logic ----------
//   private apiBaseURL = import.meta?.env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/";
//   private isRefreshing = false;
//   private refreshQueue: { resolve: (token: string | null) => void; reject: (err: unknown) => void }[] = [];

//   private enqueueRefresh(): Promise<string | null> {
//     return new Promise((resolve, reject) => {
//       this.refreshQueue.push({ resolve, reject });
//     });
//   }

//   private resolveRefreshQueue(token: string | null) {
//     this.refreshQueue.forEach((p) => p.resolve(token));
//     this.refreshQueue = [];
//   }

//   private rejectRefreshQueue(err: unknown) {
//     this.refreshQueue.forEach((p) => p.reject(err));
//     this.refreshQueue = [];
//   }


//   private setupInterceptors(): void {
//     // Request interceptor
//     this.api.interceptors.request.use(
//       (config) => {
//         // Add auth token if available
//         const token = localStorage.getItem(LS_ACCESS);
//         if (token) {
//           config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
//       },
//       (error) => {
//         return Promise.reject(error);
//       }
//     );

//     // Response interceptor
//     this.api.interceptors.response.use(
//       (response: AxiosResponse) => {
//         return response;
//       },
//       async (error: AxiosError) => {
//         const original = error.config as AxiosRequestConfig & { _retry?: boolean };
//         const status = error.response?.status;
        
//         // If 401, try refresh once
//         if (status === 401 && !original._retry) {
//           original._retry = true;
//           const { refreshToken } = useAuth.getState();

//           if (!refreshToken) {
//             useAuth.getState().logout();
//             return Promise.reject(error);
//           }

//           try {
//             if (!this.isRefreshing) {
//               this.isRefreshing = true;
//               // Call refresh only once
//               const { data } = await axios.post(`${this.apiBaseURL}/auth/refresh`, { refreshToken });
//               const newAccess = (data as any).accessToken as string;
//               const newRefresh = (data as any).refreshToken ?? refreshToken;
//               useAuth.getState().setTokens({ accessToken: newAccess, refreshToken: newRefresh });
//               this.isRefreshing = false;
//               this.resolveRefreshQueue(newAccess);
//             }
//             // Wait for the refresh result if a refresh is underway
//             const token = await this.enqueueRefresh();
//             if (token && original.headers) {
//               (original.headers as any).Authorization = `Bearer ${token}`;
//             }
//             return this.api(original);
//           } catch (e) {
//             this.isRefreshing = false;
//             this.rejectRefreshQueue(e);
//             useAuth.getState().logout();
//             return Promise.reject(e);
//           }
//         }

//         const apiError: ApiError = {
//           message: error.response?.data?.message || error.message || 'An unexpected error occurred',
//           code: error.response?.status?.toString(),
//           details: error.response?.data,
//         };

//         // Handle specific error cases
//         if (error.response?.status === 401) {
//           // Clear token and redirect to login
//           localStorage.removeItem('authToken');
//           window.location.href = '/login';
//         }

//         return Promise.reject(apiError);
//       }
//     );
//   }

//   async signUpflow(url: string, data?: any, config?: AxiosRequestConfig) {
//     const response = await this.api.post(url, data, config);
//     console.log(response);
//     return response;
//   }

//   // Generic HTTP methods
//   async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
//     const response = await this.api.get<ApiResponse<T>>(url, config);
//     return response.data.data;
//   }

//   async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
//     const response = await this.api.post<ApiResponse<T>>(url, data, config);
//     console.log(response);
//     return response.data.data;
//   }

//   async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
//     const response = await this.api.put<ApiResponse<T>>(url, data, config);
//     return response.data.data;
//   }

//   async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
//     const response = await this.api.patch<ApiResponse<T>>(url, data, config);
//     return response.data.data;
//   }

//   async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
//     const response = await this.api.delete<ApiResponse<T>>(url, config);
//     return response.data.data;
//   }

//   // Upload file method
//   async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
//     const formData = new FormData();
//     formData.append('file', file);

//     const config: AxiosRequestConfig = {
//       headers: {
//         'Content-Type': 'multipart/form-data',
//       },
//       onUploadProgress: (progressEvent) => {
//         if (onProgress && progressEvent.total) {
//           const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//           onProgress(progress);
//         }
//       },
//     };

//     return this.post<T>(url, formData, config);
//   }
// }

// // Create singleton instance
// export const apiService = new ApiService();
// export default apiService;

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  //baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5234',
  baseURL: import.meta.env.VITE_API_URL || 'https://projecthub.runasp.net',
  timeout: 0,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(error.response);
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;