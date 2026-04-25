import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth";

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    const authStore = useAuthStore();
    const token = authStore.token;

    if (!token) {
      console.warn("Cannot connect to socket: No auth token");
      return;
    }

    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    const serverUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

    this.socket = io(serverUrl, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Socket connected:", this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
      }
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("Socket disconnected manually");
    }
  }

  // Event emitters
  sendMessage(recipientId: string, content: string) {
    this.socket?.emit("message:send", { recipientId, content });
  }

  markMessageRead(messageId: string) {
    this.socket?.emit("message:read", { messageId });
  }

  sendTypingIndicator(recipientId: string, isTyping: boolean) {
    this.socket?.emit("message:typing", { recipientId, isTyping });
  }

  joinConversation(conversationId: string) {
    this.socket?.emit("conversation:join", conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit("conversation:leave", conversationId);
  }

  markNotificationRead(notificationId: string) {
    this.socket?.emit("notification:read", notificationId);
  }

  checkPresence(userIds: string[]) {
    this.socket?.emit("presence:check", userIds);
  }

  // Feed/Post events
  joinPost(postId: string) {
    this.socket?.emit("post:join", postId);
  }

  leavePost(postId: string) {
    this.socket?.emit("post:leave", postId);
  }

  // Event listeners
  onMessageReceived(callback: (message: any) => void) {
    this.socket?.on("message:new", callback);
  }

  onMessageSent(callback: (message: any) => void) {
    this.socket?.on("message:sent", callback);
  }

  onMessageRead(callback: (data: { messageId: string; readAt: Date }) => void) {
    this.socket?.on("message:read", callback);
  }

  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on("message:typing", callback);
  }

  onMessageError(callback: (error: any) => void) {
    this.socket?.on("message:error", callback);
  }

  onNotificationUpdate(callback: (data: any) => void) {
    this.socket?.on("notification:updated", callback);
  }

  onPresenceStatus(callback: (presences: any[]) => void) {
    this.socket?.on("presence:status", callback);
  }

  // Feed/Post event listeners
  onPostLiked(
    callback: (data: {
      postId: string;
      userId: string;
      likeCount: number;
    }) => void,
  ) {
    this.socket?.on("post:liked", callback);
  }

  onPostUnliked(
    callback: (data: {
      postId: string;
      userId: string;
      likeCount: number;
    }) => void,
  ) {
    this.socket?.on("post:unliked", callback);
  }

  onPostCommented(
    callback: (data: {
      postId: string;
      commentId: string;
      userId: string;
      commentCount: number;
    }) => void,
  ) {
    this.socket?.on("post:commented", callback);
  }

  onPostSaved(
    callback: (data: {
      postId: string;
      userId: string;
      saveCount: number;
    }) => void,
  ) {
    this.socket?.on("post:saved", callback);
  }

  onPostUnsaved(
    callback: (data: {
      postId: string;
      userId: string;
      saveCount: number;
    }) => void,
  ) {
    this.socket?.on("post:unsaved", callback);
  }

  onNewPost(callback: (post: any) => void) {
    this.socket?.on("feed:new-post", callback);
  }

  // Remove event listeners
  offMessageReceived(callback: (message: any) => void) {
    this.socket?.off("message:new", callback);
  }

  offMessageSent(callback: (message: any) => void) {
    this.socket?.off("message:sent", callback);
  }

  offMessageRead(callback: (data: any) => void) {
    this.socket?.off("message:read", callback);
  }

  offTyping(callback: (data: any) => void) {
    this.socket?.off("message:typing", callback);
  }

  offMessageError(callback: (error: any) => void) {
    this.socket?.off("message:error", callback);
  }

  offNotificationUpdate(callback: (data: any) => void) {
    this.socket?.off("notification:updated", callback);
  }

  offPresenceStatus(callback: (presences: any[]) => void) {
    this.socket?.off("presence:status", callback);
  }

  offPostLiked(callback: (data: any) => void) {
    this.socket?.off("post:liked", callback);
  }

  offPostUnliked(callback: (data: any) => void) {
    this.socket?.off("post:unliked", callback);
  }

  offPostCommented(callback: (data: any) => void) {
    this.socket?.off("post:commented", callback);
  }

  offPostSaved(callback: (data: any) => void) {
    this.socket?.off("post:saved", callback);
  }

  offPostUnsaved(callback: (data: any) => void) {
    this.socket?.off("post:unsaved", callback);
  }

  offNewPost(callback: (post: any) => void) {
    this.socket?.off("feed:new-post", callback);
  }

  // Utility
  get isConnected(): boolean {
    return this.socket?.connected || false;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
