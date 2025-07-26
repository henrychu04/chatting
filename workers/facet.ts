import { DurableObject } from 'cloudflare:workers';
import { sanitizeChatMessage, sanitizeUsername, containsSuspiciousContent } from '../lib/sanitizer';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: 'message' | 'join' | 'leave' | 'system';
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

interface UserRateLimit {
  tokens: number;
  lastRefill: number;
  blockedUntil?: number;
}

export class Facet extends DurableObject {
  private messageHistory: ChatMessage[] = [];
  private maxHistorySize = 100;
  private rateLimitMap: Map<string, UserRateLimit> = new Map();
  private rateLimitConfig: RateLimitConfig = {
    maxRequests: 30,
    windowMs: 60000,
    blockDurationMs: 60000,
  };

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
    const rawUsername = url.searchParams.get('username') || `User${Math.floor(Math.random() * 1000)}`;
    const username = sanitizeUsername(rawUsername); // Sanitize username

    // Accept the WebSocket with hibernation using tags for metadata
    // Tags format: ["userId:value", "username:value", "joinedAt:timestamp"]
    const tags = [`userId:${userId}`, `username:${username}`, `joinedAt:${Date.now()}`];

    this.ctx.acceptWebSocket(server, tags);

    // Send welcome message and recent history
    this.sendToSocket(server, {
      type: 'system',
      message: `Welcome to the facet, ${username}!`,
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
      message: `${username} joined the facet`,
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

      // Check rate limit for this user
      const rateLimitResult = this.checkRateLimit(userId);
      
      if (!rateLimitResult.allowed) {
        const blockedUntil = rateLimitResult.blockedUntil;
        const remainingTime = blockedUntil ? Math.ceil((blockedUntil - Date.now()) / 1000) : 0;
        
        this.sendToSocket(ws, {
          type: 'rate_limit_exceeded',
          message: `Rate limit exceeded. You are temporarily blocked for ${remainingTime} seconds.`,
          blockedUntil,
          remainingTime,
        });
        return;
      }

      switch (data.type) {
        case 'message':
          // Sanitize message content
          const rawMessage = data.message || '';

          // Check for suspicious content
          if (containsSuspiciousContent(rawMessage)) {
            this.sendToSocket(ws, {
              type: 'error',
              message: 'Message contains potentially harmful content and was blocked.',
            });
            return;
          }

          const sanitizedMessage = sanitizeChatMessage(rawMessage);

          // Don't send empty messages
          if (!sanitizedMessage.trim()) {
            return;
          }

          const chatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            userId,
            username,
            message: sanitizedMessage,
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
      message: `${username} left the facet`,
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

  private checkRateLimit(userId: string): { allowed: boolean; remainingTokens?: number; blockedUntil?: number } {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId);

    if (!userLimit) {
      this.rateLimitMap.set(userId, {
        tokens: this.rateLimitConfig.maxRequests - 1,
        lastRefill: now,
      });
      return { allowed: true, remainingTokens: this.rateLimitConfig.maxRequests - 1 };
    }

    if (userLimit.blockedUntil && now < userLimit.blockedUntil) {
      return { allowed: false, blockedUntil: userLimit.blockedUntil };
    }

    if (userLimit.blockedUntil && now >= userLimit.blockedUntil) {
      userLimit.blockedUntil = undefined;
      userLimit.tokens = this.rateLimitConfig.maxRequests;
      userLimit.lastRefill = now;
    }

    const timePassed = now - userLimit.lastRefill;
    const tokensToAdd = Math.floor(timePassed / (this.rateLimitConfig.windowMs / this.rateLimitConfig.maxRequests));
    
    if (tokensToAdd > 0) {
      userLimit.tokens = Math.min(this.rateLimitConfig.maxRequests, userLimit.tokens + tokensToAdd);
      userLimit.lastRefill = now;
    }

    if (userLimit.tokens <= 0) {
      userLimit.blockedUntil = now + this.rateLimitConfig.blockDurationMs;
      return { allowed: false, blockedUntil: userLimit.blockedUntil };
    }

    userLimit.tokens--;
    return { allowed: true, remainingTokens: userLimit.tokens };
  }

  private getOnlineUsers(): string[] {
    const webSockets = this.ctx.getWebSockets();

    const usernames = webSockets.map((ws) => {
      const tags = this.ctx.getTags(ws);
      const username = this.getTagValue(tags, 'username') || 'Anonymous';
      return username;
    });

    // Deduplicate usernames - one user might have multiple connections
    const uniqueUsers = [...new Set(usernames)];

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
