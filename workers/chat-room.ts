import { DurableObject } from 'cloudflare:workers';

interface WebSocketSession {
  webSocket: WebSocket;
  userId?: string;
  username?: string;
  joinedAt: Date;
}

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'join' | 'leave' | 'system';
}

export class ChatRoom extends DurableObject {
  private sessions: Map<WebSocket, WebSocketSession> = new Map();
  private messageHistory: ChatMessage[] = [];
  private maxHistorySize = 100;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get('upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // Handle HTTP requests (for getting room info, etc.)
    if (url.pathname === '/info') {
      return this.getRoomInfo();
    }

    if (url.pathname === '/history') {
      return this.getMessageHistory();
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the WebSocket connection
    server.accept();

    // Get user info from query params or headers
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';
    const username = url.searchParams.get('username') || `User${Math.floor(Math.random() * 1000)}`;

    // Create session
    const session: WebSocketSession = {
      webSocket: server,
      userId,
      username,
      joinedAt: new Date(),
    };

    this.sessions.set(server, session);

    // Send welcome message and recent history
    this.sendToSocket(server, {
      type: 'system',
      message: `Welcome to the chat room, ${username}!`,
      timestamp: new Date().toISOString(),
    });

    // Send recent message history
    if (this.messageHistory.length > 0) {
      this.sendToSocket(server, {
        type: 'history',
        messages: this.messageHistory.slice(-20), // Last 20 messages
      });
    }

    // Broadcast user join
    const joinMessage: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      username,
      message: `${username} joined the chat`,
      timestamp: new Date().toISOString(),
      type: 'join',
    };

    this.broadcastMessage(joinMessage, server);
    this.addToHistory(joinMessage);

    // Handle incoming messages
    server.addEventListener('message', (event) => {
      this.handleMessage(server, event.data);
    });

    // Handle connection close
    server.addEventListener('close', () => {
      this.handleDisconnect(server);
    });

    server.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnect(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private handleMessage(webSocket: WebSocket, data: string) {
    try {
      const session = this.sessions.get(webSocket);
      if (!session) return;

      const parsedData = JSON.parse(data);

      switch (parsedData.type) {
        case 'message':
          const chatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            userId: session.userId!,
            username: session.username!,
            message: parsedData.message,
            timestamp: new Date().toISOString(),
            type: 'message',
          };

          this.broadcastMessage(chatMessage);
          this.addToHistory(chatMessage);
          break;

        case 'ping':
          this.sendToSocket(webSocket, { type: 'pong' });
          break;

        default:
          console.log('Unknown message type:', parsedData.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendToSocket(webSocket, {
        type: 'error',
        message: 'Invalid message format',
      });
    }
  }

  private handleDisconnect(webSocket: WebSocket) {
    const session = this.sessions.get(webSocket);
    if (session) {
      // Broadcast user leave
      const leaveMessage: ChatMessage = {
        id: crypto.randomUUID(),
        userId: session.userId!,
        username: session.username!,
        message: `${session.username} left the chat`,
        timestamp: new Date().toISOString(),
        type: 'leave',
      };

      this.broadcastMessage(leaveMessage, webSocket);
      this.addToHistory(leaveMessage);
      this.sessions.delete(webSocket);
    }
  }

  private broadcastMessage(message: ChatMessage, excludeSocket?: WebSocket) {
    const messageStr = JSON.stringify(message);

    for (const [socket, session] of this.sessions) {
      if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(messageStr);
        } catch (error) {
          console.error('Error sending message to socket:', error);
          this.sessions.delete(socket);
        }
      }
    }
  }

  private sendToSocket(webSocket: WebSocket, data: any) {
    if (webSocket.readyState === WebSocket.OPEN) {
      try {
        webSocket.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error sending to socket:', error);
      }
    }
  }

  private addToHistory(message: ChatMessage) {
    this.messageHistory.push(message);

    // Keep only the most recent messages
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory = this.messageHistory.slice(-this.maxHistorySize);
    }
  }

  private async getRoomInfo(): Promise<Response> {
    const info = {
      activeConnections: this.sessions.size,
      users: Array.from(this.sessions.values()).map((session) => ({
        userId: session.userId,
        username: session.username,
        joinedAt: session.joinedAt,
      })),
      messageCount: this.messageHistory.length,
    };

    return new Response(JSON.stringify(info), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  private async getMessageHistory(): Promise<Response> {
    return new Response(
      JSON.stringify({
        messages: this.messageHistory,
        count: this.messageHistory.length,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
