import { defineStore } from 'pinia'
import { ref } from 'vue'
import { notificationsApi } from '@/http/endpoints/notifications'
import type { Notification } from '@/types/Notification'

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
      notifications.value = response.data.data ?? []
      unreadCount.value = response.data.unreadCount ?? 0
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch notifications'
    } finally {
      isLoading.value = false
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await notificationsApi.markAsRead(notificationId)

      const index = notifications.value.findIndex((n) => n.id === notificationId)
      if (index !== -1 && !notifications.value[index].isRead) {
        const updated = { ...notifications.value[index], isRead: true }
        const newNotifications = [...notifications.value]
        newNotifications[index] = updated
        notifications.value = newNotifications
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to mark notification as read'
      throw err
    }
  }

  async function markAllAsRead() {
    error.value = null
    try {
      const readIds = notifications.value.filter((n) => !n.isRead).map((n) => n.id)
      const readIdSet = new Set(readIds)

      await notificationsApi.markAllAsRead(readIds)

      notifications.value = notifications.value.map((n) =>
        readIdSet.has(n.id) ? { ...n, isRead: true } : n
      )
      unreadCount.value = notifications.value.filter((n) => !n.isRead).length
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
