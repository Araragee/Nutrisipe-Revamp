import httpClient from '../client'
import type { ApiResponse } from '@/typescript/interface/ApiResponse'

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
  // Get all conversations
  getConversations: () =>
    httpClient.get<ApiResponse<Conversation[]>>('/messages/conversations'),

  // Get messages in a conversation with a user
  getMessages: (userId: string, params: { page?: number; limit?: number }) =>
    httpClient.get<ApiResponse<Message[]>>(`/messages/conversations/${userId}`, {
      params
    }),

  // Send a message (REST fallback)
  sendMessage: (data: { recipientId: string; content: string }) =>
    httpClient.post<ApiResponse<Message>>('/messages/send', data),

  // Mark all messages in a conversation as read
  markConversationRead: (userId: string) =>
    httpClient.put<ApiResponse<{ success: boolean }>>(
      `/messages/conversations/${userId}/read`
    ),

  // Get total unread message count
  getUnreadCount: () =>
    httpClient.get<ApiResponse<{ unreadCount: number }>>('/messages/unread-count'),

  // Delete a message
  deleteMessage: (messageId: string) =>
    httpClient.delete<ApiResponse<{ success: boolean }>>(`/messages/${messageId}`)
}
