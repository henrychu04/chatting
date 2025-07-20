import { DurableObject } from 'cloudflare:workers';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'join' | 'leave' | 'system';
}

export class ChatRoom extends DurableObject {
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

    // Get user info from query params
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'anonymous';
    const username = url.searchParams.get('username') || `User${Math.floor(Math.random() * 1000)}`;

    // Accept the WebSocket with hibernation using tags for metadata
    // Tags format: ["userId:value", "username:value", "joinedAt:timestamp"]
    const tags = [`userId:${userId}`, `username:${username}`, `joinedAt:${Date.now()}`];

    this.ctx.acceptWebSocket(server, tags);

    // Send welcome message and recent history
    this.sendToSocket(server, {
      type: 'system',
      message: `Welcome to the chat room, ${username}!`,
      timestamp: new Date().toISOString(),
      onlineUsers: this.getOnlineUsers(),
    });

    // Send recent message history with online users
    if (this.messageHistory.length > 0) {
      this.sendToSocket(server, {
        type: 'history',
        messages: this.messageHistory.slice(-20), // Last 20 messages
        onlineUsers: this.getOnlineUsers(),
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

    this.broadcastWithUserCount(joinMessage, server);
    this.addToHistory(joinMessage);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // WebSocket Hibernation handlers
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = JSON.parse(message as string);
      const tags = this.ctx.getTags(ws);

      // Parse user info from tags
      const userId = this.getTagValue(tags, 'userId') || 'anonymous';
      const username = this.getTagValue(tags, 'username') || 'Anonymous';

      switch (data.type) {
        case 'message':
          const chatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            userId,
            username,
            message: data.message,
            timestamp: new Date().toISOString(),
            type: 'message',
          };

          this.broadcastMessage(chatMessage);
          this.addToHistory(chatMessage);
          break;

        case 'ping':
          this.sendToSocket(ws, { type: 'pong' });
          break;

        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendToSocket(ws, {
        type: 'error',
        message: 'Invalid message format',
      });
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    const tags = this.ctx.getTags(ws);
    const userId = this.getTagValue(tags, 'userId') || 'anonymous';
    const username = this.getTagValue(tags, 'username') || 'Anonymous';

    // Broadcast user leave
    const leaveMessage: ChatMessage = {
      id: crypto.randomUUID(),
      userId,
      username,
      message: `${username} left the chat`,
      timestamp: new Date().toISOString(),
      type: 'leave',
    };

    this.broadcastWithUserCount(leaveMessage, ws);
    this.addToHistory(leaveMessage);
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
    // Handle WebSocket errors if needed
  }

  // Helper methods
  private getTagValue(tags: string[], key: string): string | null {
    const tag = tags.find((tag) => tag.startsWith(`${key}:`));
    return tag ? tag.split(':', 2)[1] : null;
  }

  private getOnlineUsers(): string[] {
    const webSockets = this.ctx.getWebSockets();
    console.log('Total WebSocket connections:', webSockets.length);

    const usernames = webSockets.map((ws) => {
      const tags = this.ctx.getTags(ws);
      const username = this.getTagValue(tags, 'username') || 'Anonymous';
      console.log('Found user:', username);
      return username;
    });

    // Deduplicate usernames - one user might have multiple connections
    const uniqueUsers = [...new Set(usernames)];
    console.log('Unique users:', uniqueUsers);

    return uniqueUsers;
  }

  private broadcastMessage(message: ChatMessage, excludeSocket?: WebSocket) {
    const messageStr = JSON.stringify(message);
    const webSockets = this.ctx.getWebSockets();

    for (const socket of webSockets) {
      if (socket !== excludeSocket) {
        try {
          socket.send(messageStr);
        } catch (error) {
          console.error('Error sending message to socket:', error);
          // The hibernation API handles cleanup automatically
        }
      }
    }
  }

  private broadcastWithUserCount(message: any, excludeSocket?: WebSocket) {
    const messageWithUsers = {
      ...message,
      onlineUsers: this.getOnlineUsers(),
    };
    const messageStr = JSON.stringify(messageWithUsers);
    const webSockets = this.ctx.getWebSockets();

    for (const socket of webSockets) {
      if (socket !== excludeSocket) {
        try {
          socket.send(messageStr);
        } catch (error) {
          console.error('Error sending message to socket:', error);
        }
      }
    }
  }

  private sendToSocket(webSocket: WebSocket, data: any) {
    try {
      webSocket.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error sending to socket:', error);
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
    const webSockets = this.ctx.getWebSockets();
    const users = webSockets.map((ws) => {
      const tags = this.ctx.getTags(ws);
      return {
        userId: this.getTagValue(tags, 'userId'),
        username: this.getTagValue(tags, 'username'),
        joinedAt: new Date(parseInt(this.getTagValue(tags, 'joinedAt') || '0')),
      };
    });

    const info = {
      activeConnections: webSockets.length,
      users,
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
