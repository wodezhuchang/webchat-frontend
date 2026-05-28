import type { WebSocketMessage } from '@/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private onMessageCallback: ((data: WebSocketMessage) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private onErrorCallback: ((error: Event, message: string) => void) | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 5000;
  private username: string | null = null;
  private shouldReconnect: boolean = true;

  connect(username: string): void {
    if (this.ws) {
      this.disconnect();
    }

    this.username = username;
    this.shouldReconnect = true;

    console.log(`Connecting to WebSocket at ${WS_URL}/${username}...`);

    try {
      this.ws = new WebSocket(`${WS_URL}/${username}`);

      this.ws.onopen = () => {
        console.log('✓ WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.onConnectCallback?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          this.onMessageCallback?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason || 'No reason'})`);
        this.onDisconnectCallback?.();

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        const errorMsg = `WebSocket connection failed. Please check if the backend server is running at ${WS_URL}`;
        console.error('✗ WebSocket error:', errorMsg);
        this.onErrorCallback?.(error, errorMsg);
      };

      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn('WebSocket connection is taking too long...');
        }
      }, 5000);

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      const errorMsg = `Failed to create WebSocket: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.onErrorCallback?.(new Event('error'), errorMsg);
    }
  }

  private attemptReconnect(): void {
    if (!this.shouldReconnect || !this.username) return;

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay / 1000}s...`);

    setTimeout(() => {
      if (this.username && this.shouldReconnect) {
        this.connect(this.username);
      }
    }, this.reconnectDelay);
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.username = null;

    if (this.ws) {
      console.log('Manually disconnecting WebSocket...');
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
  }

  send(data: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('✗ Cannot send message: WebSocket is not connected');
    }
  }

  sendAI(content: string): void {
    this.send({ type: 'ai', content });
  }

  sendPrivate(to: string, content: string): void {
    this.send({ type: 'user', to, content });
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
}

export const chatWebSocket = new ChatWebSocket();
