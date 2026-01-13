# 💬 Real-Time Chat

A modern, secure real-time messaging application built with React Router v7, Cloudflare Workers, and Durable Objects.

## ✨ Features

### 🔒 **Authentication**

- **Better Auth** - Production-ready authentication with secure password hashing
- **JWT Sessions** - Automatic token refresh and session management
- **Email/Password** - Simple registration and login flow
- **Role-based Access** - User roles and permissions system

### 💬 **Real-Time Chat**

- **WebSocket Communication** - Instant messaging with Cloudflare Durable Objects
- **Facet-based Messaging** - Organized conversation channels with persistent state
- **Message Sanitization** - Advanced XSS protection with DOMPurify and custom filtering
- **Auto-Reconnection** - Seamless reconnection on connection loss
- **TRPC Integration** - Type-safe API communication between client and server
- **Anonymous & Authenticated Users** - Guest users and registered accounts

### 🎨 **Modern UI/UX**

- **Responsive Design** - Mobile-first, touch-friendly interface
- **Tailwind CSS** - Modern styling with custom animations
- **shadcn/ui Components** - Beautiful, accessible UI components
- **Real-time Status** - Connection status and user presence indicators
- **Smooth Animations** - Polished user experience with micro-interactions

### ⚡ **Performance & Security**

- **Edge Computing** - Cloudflare Workers for global low-latency
- **Server-Side Rendering** - Fast initial page loads with React Router v7
- **Type Safety** - End-to-end TypeScript with TRPC for API safety
- **Advanced Security** - Input sanitization, message validation, and XSS protection
- **Production Ready** - Structured logging, monitoring, and observability
- **Code Quality** - Automated linting, formatting, and pre-commit hooks

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Cloudflare Account** - [Sign up free](https://dash.cloudflare.com/sign-up)

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <your-repo-url>
   cd chatting
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

🎉 **Your chat app is now running at `http://localhost:5173`**

### First Time Setup

1. **Register an account** at `http://localhost:5173/login`
2. **Start chatting** - The app supports both registered and anonymous users
3. **Open multiple tabs** to test real-time messaging

## 🏗️ Architecture

### Tech Stack

- **Frontend:** React Router v7, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Cloudflare Workers, Durable Objects, TRPC, better-auth
- **Database:** Cloudflare D1 (SQLite), Drizzle ORM
- **Real-time:** WebSockets with Durable Objects (Facets)
- **Security:** DOMPurify, message validation, input sanitization
- **Code Quality:** Oxlint, Prettier, lint-staged with Husky
- **Deployment:** Cloudflare Workers (Edge computing)

### Project Structure

```
├── app/                    # React Router v7 application
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components (button, input, etc.)
│   │   ├── AuthForm.tsx   # Authentication form
│   │   ├── Facet.tsx      # Real-time chat component
│   │   ├── MessageItem.tsx # Individual message display
│   │   └── TRPCProvider.tsx # TRPC client setup
│   ├── routes/            # Page routes
│   │   ├── home.tsx       # Main chat interface
│   │   └── login.tsx      # Authentication page
│   └── lib/               # Client-side utilities
├── workers/               # Cloudflare Workers
│   ├── app.ts            # Main worker entry point
│   ├── facet.ts          # Durable Object for chat rooms
│   ├── logger.ts         # Structured logging system
│   └── message-validator.ts # Message validation & security
├── server/                # TRPC server setup
│   ├── routers/          # API route definitions
│   └── trpc.ts           # TRPC context and configuration
├── lib/                   # Shared utilities
│   ├── auth/             # Better Auth configuration
│   ├── sanitizer.ts      # Message sanitization (DOMPurify)
│   └── sanitizer-examples.md # Security examples
├── database/              # Database schema
└── drizzle/              # Database migrations
```

## 🚀 Production Deployment

### Prerequisites

- **Cloudflare Account** with Workers plan
- **Domain** (optional, can use workers.dev subdomain)
- **Git repository** for your project

### Step 1: Environment Configuration

1. **Update `wrangler.jsonc` with your domain:**

   ```json
   {
     "vars": {
       "BETTER_AUTH_URL": "https://your-actual-domain.com"
     }
   }
   ```

2. **Create production D1 database:**

   ```bash
   npx wrangler d1 create your-chat-app-production
   ```

3. **Update database ID in `wrangler.jsonc`:**
   ```json
   {
     "d1_databases": [
       {
         "binding": "DB",
         "database_name": "your-chat-app-production",
         "database_id": "your-actual-database-id"
       }
     ]
   }
   ```

### Step 2: Set Production Secrets

```bash
# Set a strong auth secret (generate with: openssl rand -hex 32)
npx wrangler secret put BETTER_AUTH_SECRET

# Set your production URL
npx wrangler secret put BETTER_AUTH_URL
# Enter: https://your-domain.com
```

### Step 3: Database Migration

```bash
# Apply migrations to production database
npx wrangler d1 migrations apply --remote DB
```

### Step 4: Deploy

```bash
# Build and deploy to Cloudflare Workers
npm run build
npx wrangler deploy
```

### Step 5: Custom Domain (Optional)

If using a custom domain:

1. **Add domain to Cloudflare:**
   - Go to Cloudflare Dashboard
   - Add your domain and configure DNS

2. **Set up Workers route:**
   - Workers & Pages → your-worker → Settings → Triggers
   - Add Custom Domain: `your-domain.com`

3. **Update configuration:**
   - Update `BETTER_AUTH_URL` in wrangler.jsonc
   - Redeploy: `npm run deploy`

### Production Environment Variables

| Variable             | Development             | Production                |
| -------------------- | ----------------------- | ------------------------- |
| `BETTER_AUTH_SECRET` | `.env` file             | Wrangler secret           |
| `BETTER_AUTH_URL`    | `http://localhost:5173` | `https://your-domain.com` |
| `NODE_ENV`           | `development`           | `production` (auto-set)   |
| Database             | Local D1                | Remote D1 binding         |

## 🔧 Development

### Code Quality & Formatting

This project uses automated code quality tools:

- **Oxlint** - Fast linting with automatic fixes
- **Prettier** - Code formatting for consistent style
- **lint-staged** - Pre-commit hooks to ensure quality
- **Husky** - Git hooks management

**Pre-commit hooks automatically:**

- Lint and auto-fix code issues
- Format all staged files
- Ensure consistent code style

### Available Scripts

```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run deploy          # Deploy to Cloudflare Workers
npm run db:generate     # Generate new migration
npm run db:migrate      # Apply migrations locally
npm run typecheck       # Run TypeScript checks
npm run lint            # Run oxlint for code quality
npm run format          # Format code with prettier
npm run format:check    # Check code formatting
```

### Key Files

- **`app/routes/home.tsx`** - Main chat interface with real-time messaging
- **`app/components/Facet.tsx`** - WebSocket client for real-time chat
- **`workers/facet.ts`** - Durable Object handling WebSocket connections
- **`lib/sanitizer.ts`** - Advanced message sanitization and XSS protection
- **`server/trpc.ts`** - TRPC server configuration and context
- **`lib/auth/better-auth.ts`** - Authentication setup and configuration
- **`database/schema.ts`** - Drizzle ORM database schema

## 🛡️ Security Features

- **Advanced Message Sanitization** - DOMPurify with custom chat-safe configurations
- **XSS Protection** - Multi-layer protection against cross-site scripting
- **Input Validation** - Comprehensive validation with Zod schemas
- **Message Filtering** - Suspicious content detection and filtering
- **Username Sanitization** - Safe username handling with character restrictions
- **Authentication** - Secure JWT sessions with better-auth
- **CSRF Protection** - Cross-site request forgery protection
- **Secure Headers** - Production security headers and policies

## 📊 Monitoring & Logging

- **Structured Logging** - Production-ready logging with worker context
- **Observability** - Cloudflare Workers observability integration
- **Performance Metrics** - Request timing and error tracking
- **Security Events** - Authentication and security event logging
- **Real-time Debugging** - WebSocket connection and message flow tracking
- **Cloudflare Analytics** - Built-in traffic, performance, and security analytics

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
