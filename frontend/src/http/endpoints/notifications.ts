import { httpClient } from '../client'
import type { Notification } from '@/typescript/interface/Notification'
import type { ApiResponse } from '@/typescript/interface/ApiResponse'

export const notificationsApi = {
  getNotifications: (limit = 20) =>
    httpClient.get<{
      success: boolean
      data: Notification[]
      unreadCount: number
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>('/notifications', {
      params: { limit },
    }),

  markAsRead: (notificationId: string) =>
    httpClient.put<{ success: boolean }>(`/notifications/${notificationId}/read`),

  markAllAsRead: (notificationIds?: string[]) =>
    httpClient.put<{ success: boolean }>('/notifications/read-all', { notificationIds }),

  deleteNotification: (notificationId: string) =>
    httpClient.delete(`/notifications/${notificationId}`),
}
