import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { Notification } from '@/typescript/interface/Notification'

// Mock the API layer so the store's network calls are controllable.
const markAllAsReadMock = vi.fn()
vi.mock('@/http/endpoints/notifications', () => ({
  notificationsApi: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: (...args: unknown[]) => markAllAsReadMock(...args),
    deleteNotification: vi.fn(),
  },
}))

import { useNotificationsStore } from '@/stores/notifications'

function makeNotif(id: string, isRead = false): Notification {
  return {
    id,
    userId: 'viewer',
    actorId: `actor-${id}`,
    type: 'like',
    isRead,
    createdAt: '2026-01-01T00:00:00.000Z',
    actor: { id: `actor-${id}`, username: `user${id}`, displayName: `User ${id}`, avatarUrl: null },
  }
}

describe('notifications store - markAllAsRead', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    markAllAsReadMock.mockReset()
    markAllAsReadMock.mockResolvedValue({ data: { success: true } })
  })

  it('marks every current notification read and clears the unread count', async () => {
    const store = useNotificationsStore()
    store.notifications = [makeNotif('1'), makeNotif('2', true), makeNotif('3')]
    store.unreadCount = 2

    await store.markAllAsRead()

    expect(store.notifications.every((n) => n.isRead)).toBe(true)
    expect(store.unreadCount).toBe(0)
    // Only the ids observed as unread are sent to the server.
    expect(markAllAsReadMock).toHaveBeenCalledWith(['1', '3'])
  })

  it('leaves a concurrently-added notification unread and counted (reconcile by id)', async () => {
    const store = useNotificationsStore()
    store.notifications = [makeNotif('1'), makeNotif('2')]
    store.unreadCount = 2

    // Simulate a socket push arriving while the request is in flight: a new
    // unread notification appears after markAllAsRead has captured the ids it
    // intends to mark read. The new item must not be flipped or dropped.
    markAllAsReadMock.mockImplementation(async () => {
      store.notifications = [makeNotif('99'), ...store.notifications]
      return { data: { success: true } }
    })

    await store.markAllAsRead()

    // The server is told to mark only the snapshot, never the late arrival,
    // so client and server agree that '99' is still unread.
    expect(markAllAsReadMock).toHaveBeenCalledWith(['1', '2'])

    const byId = Object.fromEntries(store.notifications.map((n) => [n.id, n]))
    expect(byId['1'].isRead).toBe(true)
    expect(byId['2'].isRead).toBe(true)
    // The concurrently-added notification stays unread...
    expect(byId['99'].isRead).toBe(false)
    // ...and the count reflects it rather than being blindly zeroed.
    expect(store.unreadCount).toBe(1)
  })

  it('does not change state when the API call fails', async () => {
    const store = useNotificationsStore()
    store.notifications = [makeNotif('1'), makeNotif('2')]
    store.unreadCount = 2
    markAllAsReadMock.mockRejectedValue({ response: { data: { message: 'boom' } } })

    await expect(store.markAllAsRead()).rejects.toBeDefined()

    expect(store.notifications.every((n) => !n.isRead)).toBe(true)
    expect(store.unreadCount).toBe(2)
    expect(store.error).toBe('boom')
  })

  it('clears a stale error when a later call succeeds', async () => {
    const store = useNotificationsStore()
    store.notifications = [makeNotif('1')]
    store.unreadCount = 1

    markAllAsReadMock.mockRejectedValueOnce({ response: { data: { message: 'boom' } } })
    await expect(store.markAllAsRead()).rejects.toBeDefined()
    expect(store.error).toBe('boom')

    // A subsequent successful call must not leave the store in an error state.
    await store.markAllAsRead()
    expect(store.error).toBeNull()
  })
})
