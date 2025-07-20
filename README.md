# 💬 Real-Time Chat Application

A modern, production-ready real-time chat application built with React Router v7, Cloudflare Workers, and Durable Objects.

## ✨ Features

### 🔒 **Authentication**

- **Better Auth** - Production-ready authentication with secure password hashing
- **JWT Sessions** - Automatic token refresh and session management
- **Email/Password** - Simple registration and login flow
- **Role-based Access** - User roles and permissions system

### 💬 **Real-Time Chat**

- **WebSocket Communication** - Instant messaging with Cloudflare Durable Objects
- **Multiple Chat Rooms** - Support for different chat channels
- **Message History** - Persistent message storage and retrieval
- **Auto-Reconnection** - Seamless reconnection on connection loss
- **Anonymous & Authenticated Users** - Guest users and registered accounts

### 🎨 **Modern UI/UX**

- **Responsive Design** - Mobile-first, touch-friendly interface
- **Tailwind CSS** - Modern styling with custom animations
- **shadcn/ui Components** - Beautiful, accessible UI components
- **Real-time Status** - Connection status and user presence indicators
- **Smooth Animations** - Polished user experience with micro-interactions

### ⚡ **Performance & Scalability**

- **Edge Computing** - Cloudflare Workers for global low-latency
- **Server-Side Rendering** - Fast initial page loads
- **Type Safety** - End-to-end TypeScript for reliability
- **Production Ready** - Security, logging, and monitoring built-in

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Cloudflare Account** - [Sign up free](https://dash.cloudflare.com/sign-up)

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <your-repo-url>
   cd chatting-app-2
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   # Copy .env.example to .env and fill in your values
   cp .env.example .env

   # Generate a secure secret
   openssl rand -hex 32
   ```

3. **Initialize the database:**

   ```bash
   npm run db:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

🎉 **Your chat app is now running at `http://localhost:8787`**

### First Time Setup

1. **Register an account** at `http://localhost:8787/login`
2. **Start chatting** - The app supports both registered and anonymous users
3. **Open multiple tabs** to test real-time messaging

## 🏗️ Architecture

### Tech Stack

- **Frontend:** React Router v7, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Cloudflare Workers, Durable Objects, better-auth
- **Database:** Cloudflare D1 (SQLite), Drizzle ORM
- **Real-time:** WebSockets with Durable Objects
- **Deployment:** Cloudflare Workers (Edge computing)

### Project Structure

```
├── app/                    # React Router application
│   ├── components/         # Reusable UI components
│   ├── routes/            # Page routes (home, login)
│   └── lib/               # Utilities and configurations
├── workers/               # Cloudflare Workers
│   ├── app.ts            # Main worker entry point
│   ├── chat-room.ts      # Durable Object for chat rooms
│   ├── logger.ts         # Production logging system
│   └── message-validator.ts # Input validation & security
├── database/              # Database schema and migrations
├── lib/auth/             # Authentication configuration
└── drizzle/              # Database migrations
```

## 🚀 Production Deployment

### 1. Environment Setup

Update your `.env` file for production:

```bash
# Required for production
BETTER_AUTH_SECRET="your-secure-32-char-hex-key"
BETTER_AUTH_URL="https://your-domain.com"
NODE_ENV="production"

# Get these from Cloudflare Dashboard
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_API_TOKEN="your-api-token"
```

### 2. Database Setup

```bash
# Create production database
npx wrangler d1 create your-chat-app-production

# Update wrangler.jsonc with the database ID
# Run migrations to production
npx wrangler d1 migrations apply your-chat-app-production --remote
```

### 3. Deploy

```bash
# Build and deploy to Cloudflare Workers
npm run build
npm run deploy

# Your app will be live at https://your-worker.your-subdomain.workers.dev
```

### 4. Custom Domain (Optional)

1. Add your domain to Cloudflare
2. Set up DNS records
3. Configure SSL/TLS encryption
4. Update `BETTER_AUTH_URL` to your custom domain

## 🔧 Development

### Available Scripts

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run deploy          # Deploy to Cloudflare Workers
npm run db:generate     # Generate new migration
npm run db:migrate      # Apply migrations locally
npm run typecheck       # Run TypeScript checks
```

### Key Files

- **`app/routes/home.tsx`** - Main chat interface
- **`app/components/ChatRoom.tsx`** - Real-time chat component
- **`workers/chat-room.ts`** - WebSocket handling with Durable Objects
- **`lib/auth/better-auth.ts`** - Authentication configuration
- **`database/schema.ts`** - Database schema definitions

## 🛡️ Security Features

- **Input Validation** - All user inputs are validated and sanitized
- **Rate Limiting** - Protection against spam and abuse
- **CSRF Protection** - Cross-site request forgery protection
- **Secure Headers** - Security headers for production deployment
- **Authentication** - Secure JWT sessions with auto-refresh

## 📊 Monitoring & Logging

- **Structured Logging** - Comprehensive logging for debugging
- **Performance Metrics** - Request timing and error tracking
- **Security Events** - Authentication and security event logging
- **Cloudflare Analytics** - Built-in traffic and performance analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Resources

- **[Production Deployment Guide](./PRODUCTION-DEPLOYMENT.md)** - Complete deployment checklist
- **[React Router v7 Docs](https://reactrouter.com/)** - Framework documentation
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Platform documentation
- **[Better Auth](https://better-auth.com/)** - Authentication library
- **[Durable Objects](https://developers.cloudflare.com/durable-objects/)** - Real-time state management

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ using React Router v7, Cloudflare Workers, and modern web technologies.
