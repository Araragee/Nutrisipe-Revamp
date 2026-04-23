import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationsApi } from '@/http/endpoints/notifications'
import type { Notification } from '@/typescript/interface/Notification'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchNotifications(limit = 20) {
    isLoading.value = true
    error.value = null

    try {
      const response = await notificationsApi.getNotifications(limit)
      notifications.value = response.data.data.notifications
      unreadCount.value = response.data.data.unreadCount
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch notifications'
    } finally {
      isLoading.value = false
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await notificationsApi.markAsRead(notificationId)

      const notification = notifications.value.find((n) => n.id === notificationId)
      if (notification && !notification.isRead) {
        notification.isRead = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to mark notification as read'
      throw err
    }
  }

  async function markAllAsRead() {
    try {
      await notificationsApi.markAllAsRead()

      notifications.value.forEach((n) => {
        n.isRead = true
      })
      unreadCount.value = 0
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to mark all notifications as read'
      throw err
    }
  }

  async function deleteNotification(notificationId: string) {
    try {
      await notificationsApi.deleteNotification(notificationId)

      const notification = notifications.value.find((n) => n.id === notificationId)
      if (notification && !notification.isRead) {
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }

      notifications.value = notifications.value.filter((n) => n.id !== notificationId)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to delete notification'
      throw err
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  }
})
