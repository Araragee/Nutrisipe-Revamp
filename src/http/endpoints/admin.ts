import { httpClient } from '../client'
import type { ApiResponse } from '@/types'

interface AdminStats {
  users: {
    total: number
    active: number
    banned: number
    newToday: number
  }
  content: {
    posts: number
    comments: number
    newPostsToday: number
  }
  moderation: {
    pendingReports: number
  }
}

export const adminApi = {
  getStats: () => httpClient.get<ApiResponse<AdminStats>>('/admin/stats'),

  getUsers: (params: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  }) => httpClient.get<ApiResponse<any[]>>('/admin/users', { params }),

  updateUserRole: (userId: string, role: string) =>
    httpClient.put<ApiResponse<any>>(`/admin/users/${userId}/role`, { role }),

  banUser: (userId: string, reason: string) =>
    httpClient.post<ApiResponse<any>>(`/admin/users/${userId}/ban`, { reason }),

  unbanUser: (userId: string) =>
    httpClient.post<ApiResponse<any>>(`/admin/users/${userId}/unban`),

  getReports: (params: { page?: number; limit?: number; status?: string; type?: string }) =>
    httpClient.get<ApiResponse<any[]>>('/admin/reports', { params }),

  updateReportStatus: (reportId: string, status: string, moderatorNote?: string) =>
    httpClient.put<ApiResponse<any>>(`/admin/reports/${reportId}`, { status, moderatorNote }),

  deletePost: (postId: string) => httpClient.delete(`/admin/posts/${postId}`),

  deleteComment: (commentId: string) => httpClient.delete(`/admin/comments/${commentId}`),
}
