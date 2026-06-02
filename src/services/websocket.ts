import type { WebSocketMessage } from '@/types';

const getWebSocketUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

const WS_URL = getWebSocketUrl();

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((data: WebSocketMessage) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private onErrorCallback: ((error: Event, message: string) => void) | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 5000;
  private username: string | null = null;
  private shouldReconnect: boolean = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isManualDisconnect: boolean = false;

  connect(username: string): void {
    this.isManualDisconnect = false;

    if (this.ws) {
      this.cleanup();
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.username = username;
    this.shouldReconnect = true;
    this.reconnectAttempts = 0;

    const fullUrl = `${WS_URL}/${username}`;
    console.log(`🔌 正在连接 WebSocket: ${fullUrl}`);

    try {
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        console.log(`✅ WebSocket 连接成功! URL: ${fullUrl}`);
        this.reconnectAttempts = 0;
        this.onConnectCallback?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log(`📨 收到消息:`, data);
          this.onMessageCallback?.(data);
        } catch (error) {
          console.error('❌ 解析消息失败:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 WebSocket 关闭 (code: ${event.code}, reason: ${event.reason || '未知'})`);
        this.onDisconnectCallback?.();

        if (this.isManualDisconnect) {
          console.log('🔒 手动断开，不重连');
          return;
        }

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else if (!this.shouldReconnect) {
          console.log('🔒 不重连标志已设置');
        } else {
          console.log('⚠️ 达到最大重连次数，停止尝试');
        }
      };

      this.ws.onerror = (error) => {
        const errorMsg = `WebSocket 连接失败! 请检查后端服务是否运行在 ${WS_URL}`;
        console.error(`❌ ${errorMsg}`);
        console.error('详细错误:', error);
        this.onErrorCallback?.(error, errorMsg);
      };

      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn('⏳ WebSocket 连接超时警告 - 正在尝试连接中...');
        }
      }, 5000);

    } catch (error) {
      console.error('❌ 创建 WebSocket 失败:', error);
      const errorMsg = `创建连接失败: ${error instanceof Error ? error.message : '未知错误'}`;
      this.onErrorCallback?.(new Event('error'), errorMsg);
    }
  }

  private attemptReconnect(): void {
    if (!this.shouldReconnect || !this.username || this.isManualDisconnect) return;

    this.reconnectAttempts++;
    console.log(`🔄 重连尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts}，${this.reconnectDelay / 1000}秒后重试...`);

    this.reconnectTimer = setTimeout(() => {
      if (this.username && this.shouldReconnect && !this.isManualDisconnect) {
        this.connect(this.username);
      }
    }, this.reconnectDelay);
  }

  private cleanup(): void {
    if (this.ws) {
      try {
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.close(1000, '清理连接');
      } catch (error) {
        console.error('清理连接时出错:', error);
      }
      this.ws = null;
    }
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    this.shouldReconnect = false;
    this.username = null;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.cleanup();
    console.log('👋 WebSocket 已断开');
  }

  send(data: object): void {
    if (!this.ws) {
      console.error('❌ 无法发送消息: WebSocket 实例不存在');
      return;
    }

    if (this.ws.readyState !== WebSocket.OPEN) {
      console.error(`❌ 无法发送消息: WebSocket 状态不正确 (readyState: ${this.ws.readyState})`);
      return;
    }

    try {
      const message = JSON.stringify(data);
      console.log(`📤 发送消息: ${message}`);
      this.ws.send(message);
    } catch (error) {
      console.error('❌ 发送消息失败:', error);
    }
  }

  sendAI(content: string, conversationId?: number): void {
    const data: any = { type: 'ai', content };
    if (conversationId !== undefined) {
      data.conversation_id = conversationId;
    }
    this.send(data);
  }

  sendPrivate(to: string, content: string, conversationId?: number): void {
    const data: any = { type: 'user', to, content };
    if (conversationId !== undefined) {
      data.conversation_id = conversationId;
    }
    this.send(data);
  }

  requestOnlineUsers(): void {
    this.send({ type: 'users' });
  }

  sendPing(): void {
    this.send({ type: 'ping' });
  }

  setOnMessage(callback: (data: WebSocketMessage) => void): void {
    this.onMessageCallback = callback;
  }

  setOnConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  setOnDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  setOnError(callback: (error: Event, message: string) => void): void {
    this.onErrorCallback = callback;
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }

  getUrl(): string | null {
    return this.ws?.url ?? null;
  }
}

export const chatWebSocket = new ChatWebSocket();
