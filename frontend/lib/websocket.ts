/**
 * Native WebSocket manager with auto-reconnect, heartbeat, and event dispatch.
 */

type MessageHandler = (data: unknown) => void;

interface WebSocketMessage {
  type: string;
  payload: unknown;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string = "";
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private isIntentionallyClosed = false;

  connect(token: string): void {
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/api/v1/ws";
    this.url = `${baseUrl}?token=${token}`;
    this.isIntentionallyClosed = false;
    this._connect();
  }

  private _connect(): void {
    if (typeof window === "undefined") return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("[WS] Connected");
      this.reconnectAttempts = 0;
      this._startHeartbeat();
      this._emit("connection", { status: "connected" });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this._emit(message.type, message.payload);
        this._emit("*", message); // wildcard listener
      } catch {
        console.warn("[WS] Non-JSON message:", event.data);
      }
    };

    this.ws.onclose = (event) => {
      console.log("[WS] Closed:", event.code, event.reason);
      this._stopHeartbeat();
      this._emit("connection", { status: "disconnected" });

      if (!this.isIntentionallyClosed) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error("[WS] Error:", error);
      this._emit("error", error);
    };
  }

  private _startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
  }

  private _stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WS] Max reconnect attempts reached");
      return;
    }
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    this.reconnectAttempts++;
    setTimeout(() => this._connect(), delay);
  }

  send(type: string, payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    // Return unsubscribe function
    return () => this.handlers.get(event)?.delete(handler);
  }

  private _emit(event: string, data: unknown): void {
    this.handlers.get(event)?.forEach((handler) => handler(data));
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this._stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Global singleton
export const wsManager = new WebSocketManager();
