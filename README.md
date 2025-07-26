# 💬 Edge Chat

A modern, production-ready real-time messaging application built with React Router v7, Cloudflare Workers, and Durable Objects.

## ✨ Features

### 🔒 **Authentication**

- **Better Auth** - Production-ready authentication with secure password hashing
- **JWT Sessions** - Automatic token refresh and session management
- **Email/Password** - Simple registration and login flow
- **Role-based Access** - User roles and permissions system

### 💬 **Real-Time Chat**

- **WebSocket Communication** - Instant messaging with Cloudflare Durable Objects
- **Multiple Facets** - Support for different messaging channels
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
   cd edge-chat
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
│   ├── facet.ts          # Durable Object for facets
│   ├── logger.ts         # Production logging system
│   └── message-validator.ts # Input validation & security
├── database/              # Database schema and migrations
├── lib/auth/             # Authentication configuration
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
- **`app/components/Facet.tsx`** - Real-time messaging component
- **`workers/facet.ts`** - WebSocket handling with Durable Objects
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

🌐 **Visit Edge Chat at [edgechat.io](https://edgechat.io)**
