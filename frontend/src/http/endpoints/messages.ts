import httpClient from '../client'
import type { ApiResponse } from '@/types/ApiResponse'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  recipientId: string
  content: string
  isRead: boolean
  readAt: string | null
  createdAt: string
  sender: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export interface Conversation {
  id: string
  otherUser: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  lastMessage: {
    id: string
    content: string
    createdAt: string
    isRead: boolean
    senderId: string
  } | null
  unreadCount: number
  lastMessageAt: string | null
  createdAt: string
}

export const messagesApi = {
  getConversations: () =>
    httpClient.get<ApiResponse<Conversation[]>>('/messages/conversations'),

  getMessages: (userId: string, params: { page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<Message[]>>(`/messages/conversations/${userId}`, {
      params
    }),

  sendMessage: (data: { recipientId: string; content: string }) =>
    httpClient.post<ApiResponse<Message>>('/messages/send', data),

  markConversationRead: (userId: string) =>
    httpClient.put<ApiResponse<{ success: boolean }>>(
      `/messages/conversations/${userId}/read`
    ),

  getUnreadCount: () =>
    httpClient.get<ApiResponse<{ unreadCount: number }>>('/messages/unread-count'),

  deleteMessage: (messageId: string) =>
    httpClient.delete<ApiResponse<{ success: boolean }>>(`/messages/${messageId}`)
}
