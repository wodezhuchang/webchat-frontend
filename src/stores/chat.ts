import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/services/api';
import { chatWebSocket } from '@/services/websocket';
import type { Message, WebSocketMessage } from '@/types';

export const useChatStore = defineStore('chat', () => {
  const currentUser = ref<string | null>(null);
  const messages = ref<Message[]>([]);
  const onlineUsers = ref<string[]>([]);
  const isConnected = ref<boolean>(false);
  const selectedUser = ref<string | null>(null);
  const isPrivateMode = ref<boolean>(false);
  const isLoading = ref<boolean>(false);
  const connectionError = ref<string | null>(null);

  let heartbeatTimer: number | null = null;

  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleWebSocketMessage = (data: WebSocketMessage): void => {
    switch (data.type) {
      case 'ai':
        if (data.content) {
          messages.value.push({
            id: generateId(),
            role: 'assistant',
            content: data.content,
            timestamp: new Date()
          });
        }
        break;

      case 'private':
        if (data.from && data.content) {
          messages.value.push({
            id: generateId(),
            role: 'private',
            content: data.content,
            from: data.from,
            timestamp: new Date()
          });
        }
        break;

      case 'users':
        if (data.users) {
          onlineUsers.value = data.users.filter(user => user !== currentUser.value);
        }
        break;

      case 'info':
        if (data.content) {
          messages.value.push({
            id: generateId(),
            role: 'system',
            content: data.content,
            timestamp: new Date()
          });
        }
        break;

      case 'error':
        if (data.content) {
          messages.value.push({
            id: generateId(),
            role: 'system',
            content: `错误: ${data.content}`,
            timestamp: new Date()
          });
        }
        break;

      case 'pong':
        console.log('Heartbeat response received');
        break;
    }
  };

  const startHeartbeat = (): void => {
    stopHeartbeat();
    heartbeatTimer = window.setInterval(() => {
      if (isConnected.value) {
        chatWebSocket.sendPing();
      }
    }, 30000);
  };

  const stopHeartbeat = (): void => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  const login = async (username: string): Promise<boolean> => {
    try {
      const response = await api.login(username);
      if (response.success) {
        currentUser.value = username;
        connectWebSocket();
        return true;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const connectWebSocket = (): void => {
    if (!currentUser.value) return;

    chatWebSocket.connect(currentUser.value);

    chatWebSocket.setOnConnect(() => {
      isConnected.value = true;
      startHeartbeat();
      chatWebSocket.requestOnlineUsers();
    });

    chatWebSocket.setOnDisconnect(() => {
      isConnected.value = false;
      stopHeartbeat();
    });

    chatWebSocket.setOnMessage(handleWebSocketMessage);

    chatWebSocket.setOnError((error) => {
      console.error('WebSocket error:', error);
    });
  };

  const disconnectWebSocket = (): void => {
    chatWebSocket.disconnect();
    isConnected.value = false;
    stopHeartbeat();
  };

  const sendMessage = (content: string): void => {
    if (!currentUser.value || !content.trim()) return;

    if (isPrivateMode.value && selectedUser.value) {
      messages.value.push({
        id: generateId(),
        role: 'private',
        content: content,
        from: currentUser.value,
        to: selectedUser.value,
        timestamp: new Date()
      });
      chatWebSocket.sendPrivate(selectedUser.value, content);
    } else {
      messages.value.push({
        id: generateId(),
        role: 'user',
        content: content,
        timestamp: new Date()
      });
      chatWebSocket.sendAI(content);
    }
  };

  const sendPrivateMessage = async (to: string, content: string): Promise<void> => {
    if (!currentUser.value) return;

    try {
      await api.sendPrivate(currentUser.value, to, content);
    } catch (error) {
      console.error('Failed to send private message:', error);
      throw error;
    }
  };

  const getOnlineUsers = async (): Promise<void> => {
    try {
      const response = await api.getOnlineUsers();
      if (response.success) {
        onlineUsers.value = response.users.filter(user => user !== currentUser.value);
      }
    } catch (error) {
      console.error('Failed to get online users:', error);
    }
  };

  const getHistory = async (): Promise<void> => {
    if (!currentUser.value) return;

    isLoading.value = true;
    try {
      const response = await api.getHistory(currentUser.value);
      if (response.success && response.history) {
        messages.value = response.history.map((msg, index) => ({
          id: generateId() + index,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date()
        }));
      }
    } catch (error) {
      console.error('Failed to get history:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const selectUser = (username: string | null): void => {
    selectedUser.value = username;
    isPrivateMode.value = username !== null;
  };

  const clearMessages = (): void => {
    messages.value = [];
  };

  const logout = (): void => {
    disconnectWebSocket();
    currentUser.value = null;
    selectedUser.value = null;
    isPrivateMode.value = false;
    clearMessages();
    onlineUsers.value = [];
  };

  return {
    currentUser,
    messages,
    onlineUsers,
    isConnected,
    selectedUser,
    isPrivateMode,
    isLoading,
    connectionError,
    login,
    connectWebSocket,
    disconnectWebSocket,
    sendMessage,
    sendPrivateMessage,
    getOnlineUsers,
    getHistory,
    selectUser,
    clearMessages,
    logout
  };
});
