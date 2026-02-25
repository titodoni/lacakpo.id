# lacakPO.id Deployment Specification

> **Target Platform:** Vercel (Serverless)  
> **Database:** Turso (libSQL/SQLite)  
> **Framework:** Next.js 14 (App Router)  
> **Last Updated:** 2026-02-25

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel Edge                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js 14 Application                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │  App Router │  │  API Routes │  │  Middleware │ │   │
│  │  │  (Static)   │  │ (Dynamic)   │  │   (Auth)    │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  │                         │                           │   │
│  │              Iron Session (HTTP-only)               │   │
│  │                         │                           │   │
│  │              Prisma + @prisma/adapter-libsql        │   │
│  │                         │                           │   │
│  │              @libsql/client (HTTP/WebSocket)        │   │
│  └─────────────────────────┼───────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Turso Database (libSQL)                 │   │
│  │         AWS ap-south-1 (Mumbai) Region               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Runtime** | Node.js 18+ | Prisma requires Node runtime (not Edge) |
| **Database** | Turso (libSQL) | SQLite-compatible, serverless-friendly, edge-distributed |
| **Auth** | Iron Session | Stateless, signed cookies, no server-side session store |
| **ORM** | Prisma 5.22 | Type-safe, mature, with libSQL adapter support |
| **Session** | HTTP-only cookies | Secure against XSS, works across serverless functions |

---

## 2. Prerequisites

### 2.1 Required Accounts

- **GitHub:** Repository hosting
- **Vercel:** Deployment platform (import from GitHub)
- **Turso:** Database hosting (https://app.turso.tech)

### 2.2 Local Development Tools

```bash
# Required
node >= 18.0.0
npm >= 9.0.0

# Optional but recommended
git >= 2.40
```

### 2.3 Repository Structure

```
lacakpo.id/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (must be dynamic)
│   ├── layout.tsx         # Root layout with ThemeProvider
│   └── ...
├── components/            # React components
├── lib/                   # Utilities, database client
│   ├── prisma.ts         # Prisma client with Turso adapter
│   └── themes/           # Theme system
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Prisma migrations
├── scripts/              # Deployment helpers
│   └── init-db.js       # Turso database initialization
├── turso-clean.sql      # Schema for Turso
├── turso-seed.sql       # Seed data
└── package.json
```

---

## 3. Environment Variables

### 3.1 Production Environment (Vercel)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | Turso connection URL | `libsql://lacakpodemo-user.turso.io` |
| `DATABASE_AUTH_TOKEN` | ✅ | Turso auth token | `eyJhbGciOiJFZERTQSIs...` |
| `SESSION_SECRET` | ✅ | Iron session secret (32+ chars) | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL for callbacks | `https://lacakpo-id.vercel.app` |
| `NODE_ENV` | ✅ | Runtime environment | `production` |

### 3.2 Local Development (.env.local)

```env
# Local SQLite (for development only)
DATABASE_URL="file:./dev.db"
# DATABASE_AUTH_TOKEN not needed locally

SESSION_SECRET="local-dev-secret-min-32-characters-long"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3.3 Variable Constraints

```typescript
// SESSION_SECRET must be >= 32 characters
const MIN_SESSION_SECRET_LENGTH = 32;

// DATABASE_URL must use libsql:// protocol in production
const PROD_DATABASE_PROTOCOL = 'libsql://';

// NODE_ENV must be 'production' for Vercel builds
const REQUIRED_NODE_ENV = 'production';
```

---

## 4. Database Setup (Turso)

### 4.1 Create Database

**Via Turso Web Dashboard:**
1. Visit https://app.turso.tech
2. Click "Create Database"
3. Name: `lacakpodemo`
4. Region: `Singapore` (ap-southeast-1) - closest to Indonesia
5. Click "Create"

**Via CLI (if installed):**
```bash
turso auth login
turso db create lacakpodemo --region sin
turso db show lacakpodemo  # Get URL
```

### 4.2 Initialize Schema

**Important:** Prisma `migrate deploy` does NOT work with Turso URLs directly.

Use the provided SQL file:

```bash
# Method 1: Turso CLI
turso db shell lacakpodemo < turso-clean.sql

# Method 2: Web Dashboard Shell
# 1. Go to https://app.turso.tech → Database → Shell
# 2. Copy-paste contents of turso-clean.sql
# 3. Execute

# Method 3: Node.js script
$env:DATABASE_URL="libsql://lacakpodemo-user.turso.io"
$env:DATABASE_AUTH_TOKEN="your-token"
node scripts/init-db.js
```

### 4.3 Seed Data

```sql
-- Seed users (password: demo for all)
INSERT OR IGNORE INTO "users" ("id", "username", "password_hash", "name", "role", "department", "is_active", "created_at") 
VALUES 
('u1', 'admin', '$2b$10$DEPO/.UYfKomQ9Cttszrh.0zVHEBXD7uNcS/u54.KFTXR9avN9sOC', 'Administrator', 'super_admin', 'management', true, datetime('now')),
('u2', 'andi', '$2b$10$DEPO/.UYfKomQ9Cttszrh.0zVHEBXD7uNcS/u54.KFTXR9avN9sOC', 'Andi CNC', 'cnc_operator', 'production', true, datetime('now')),
('u3', 'budi', '$2b$10$DEPO/.UYfKomQ9Cttszrh.0zVHEBXD7uNcS/u54.KFTXR9avN9sOC', 'Budi Drafter', 'drafter', 'drafting', true, datetime('now')),
('u4', 'sari', '$2b$10$DEPO/.UYfKomQ9Cttszrh.0zVHEBXD7uNcS/u54.KFTXR9avN9sOC', 'Sari Purchasing', 'purchasing', 'purchasing', true, datetime('now')),
('u5', 'dewi', '$2b$10$DEPO/.UYfKomQ9Cttszrh.0zVHEBXD7uNcS/u54.KFTXR9avN9sOC', 'Dewi QC', 'qc', 'qc', true, datetime('now')),
('u6', 'finance', '$2b$10$DEPO/.UYfKomQ9Cttszrh.0zVHEBXD7uNcS/u54.KFTXR9avN9sOC', 'Finance Admin', 'finance', 'finance', true, datetime('now')),
('u7', 'manager', '$2b$10$DEPO/.UYfKomQ9Cttszrh.0zVHEBXD7uNcS/u54.KFTXR9avN9sOC', 'Pak Manager', 'manager', 'management', true, datetime('now')),
('u8', 'sales', '$2b$10$DEPO/.UYfKomQ9Cttszrh.0zVHEBXD7uNcS/u54.KFTXR9avN9sOC', 'Sales Admin', 'sales_admin', 'sales', true, datetime('now')),
('u9', 'delivery', '$2b$10$DEPO/.UYfKomQ9Cttszrh.0zVHEBXD7uNcS/u54.KFTXR9avN9sOC', 'Delivery Staff', 'delivery', 'logistics', true, datetime('now'));

-- Sample clients
INSERT OR IGNORE INTO "clients" ("id", "code", "name", "contact_person", "phone", "created_at") 
VALUES 
('c1', 'SA', 'PT Sinar Abadi', 'Pak Ahmad', '021-5550101', datetime('now')),
('c2', 'DP', 'PT Delta Prima', 'Ibu Sari', '021-5550202', datetime('now')),
('c3', 'MK', 'PT Maju Kencana', 'Pak Budi', '021-5550303', datetime('now'));
```

### 4.4 Verify Database

```sql
-- Check users
SELECT username, name, role FROM "users";

-- Should return 9 rows:
-- admin, andi, budi, sari, dewi, finance, manager, sales, delivery
```

---

## 5. Build Configuration

### 5.1 Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "vercel-build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

**Critical:** Do NOT include `prisma migrate deploy` in `vercel-build` - it doesn't support `libsql://` URLs.

### 5.2 Next.js Config

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
```

### 5.3 Prisma Configuration

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### 5.4 Prisma Client with Turso Adapter

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || '';
  
  if (databaseUrl.startsWith('libsql://')) {
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }
  
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### 5.5 API Route Configuration

All API routes using `requireAuth()` MUST export dynamic config:

```typescript
// app/api/any-route/route.ts
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await requireAuth();
  // ...
}
```

**Affected routes:** All routes in `app/api/**/route.ts` that import `requireAuth`.

---

## 6. Vercel Deployment Steps

### 6.1 Import Project

1. Go to https://vercel.com/new
2. Import GitHub repository: `titodoni/lacakpo.id`
3. Framework Preset: `Next.js`
4. Build Command: `npm run vercel-build`
5. Output Directory: `.next`
6. Install Command: `npm install`

### 6.2 Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables:

```
DATABASE_URL=libsql://lacakpodemo-YOURNAME.turso.io
DATABASE_AUTH_TOKEN=eyJhbGci... (your turso token)
SESSION_SECRET=(openssl rand -base64 32)
NEXT_PUBLIC_APP_URL=https://YOUR-PROJECT.vercel.app
NODE_ENV=production
```

### 6.3 Deploy

Click "Deploy" and wait for build (~2-3 minutes).

### 6.4 Verify Deployment

```bash
# Check build logs
# Should show: ▲ Next.js 14.2.21
# Should show: ✓ Compiled successfully
# Should show: ✓ Linting and checking validity of types

# Test endpoints
curl https://YOUR-PROJECT.vercel.app/api/auth/me
# Should return: {"error":"Unauthorized"} (401)
```

---

## 7. Post-Deployment Verification

### 7.1 Functional Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| **Login** | POST /api/auth/login with admin/demo | 200 + session cookie |
| **Auth Check** | GET /api/auth/me with cookie | User object |
| **Dashboard** | GET /api/dashboard | Stats JSON |
| **Theme Switch** | Click theme picker | Visual change, persisted |
| **PO List** | Navigate to /pos | List of purchase orders |

### 7.2 Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | demo | Super Admin |
| manager | demo | Manager |
| sales | demo | Sales Admin |
| andi | demo | CNC Operator |
| budi | demo | Drafter |
| sari | demo | Purchasing |
| dewi | demo | QC |
| finance | demo | Finance |
| delivery | demo | Delivery |

### 7.3 Monitoring

**Vercel Analytics:**
- URL: https://vercel.com/dashboard → Project → Analytics
- Tracks: Web Vitals, Traffic, Errors

**Speed Insights:**
- URL: https://vercel.com/dashboard → Project → Speed Insights
- Tracks: LCP, FID, CLS, TTFB

---

## 8. Troubleshooting

### 8.1 Build Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `PrismaLibSQL not exported` | Version mismatch | Ensure `@prisma/adapter-libsql@5.22.0` matches `@prisma/client@5.22.0` |
| `Dynamic server usage` | Static generation attempted | Add `export const dynamic = 'force-dynamic'` to API routes |
| `URL must start with file:` | Prisma migrate on Turso | Don't run `prisma migrate deploy` in vercel-build script |
| `Cannot find module '@libsql/client'` | Missing dependency | Run `npm install @libsql/client` |

### 8.2 Runtime Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid credentials` | Wrong password hash | Update password_hash in Turso with correct bcrypt hash |
| `Database connection failed` | Wrong DATABASE_URL | Verify URL format: `libsql://host.turso.io` |
| `401 Unauthorized` | Session expired or missing | Clear cookies, re-login |
| `Slow API responses` | Cold start | Normal for serverless, will warm up |

### 8.3 Database Issues

```bash
# Check if database is accessible
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});
client.execute('SELECT 1').then(() => console.log('OK')).catch(e => console.error(e));
"
```

---

## 9. Maintenance

### 9.1 Updating Passwords

```javascript
// scripts/hash-password.js
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('newpassword', 10);
console.log(hash);
```

Then update in Turso:
```sql
UPDATE "users" SET "password_hash" = 'NEW_HASH' WHERE "username" = 'admin';
```

### 9.2 Adding Migrations

Since Turso doesn't support Prisma Migrate directly:

1. Generate SQL locally:
```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script > migration.sql
```

2. Run SQL in Turso Shell

### 9.3 Backups

Turso provides automatic backups. To download manually:
```bash
turso db shell lacakpodemo ".dump" > backup.sql
```

---

## 10. Security Checklist

- [ ] SESSION_SECRET is 32+ random characters
- [ ] DATABASE_AUTH_TOKEN is kept secret (not in repo)
- [ ] Cookies are httpOnly, secure, sameSite=strict
- [ ] API routes have proper RBAC checks
- [ ] No SQL injection (Prisma ORM used)
- [ ] No XSS (React auto-escapes)
- [ ] Environment variables not exposed to client

---

## 11. Architecture Decisions

### Why Turso over Vercel Postgres?
- **Lower latency** for read-heavy workloads
- **SQLite compatibility** with existing Prisma schema
- **Edge-distributed** globally
- **Generous free tier** (500 databases, 9GB storage)

### Why Iron Session over NextAuth?
- **Simpler** for username/password auth
- **No database** for session storage
- **Stateless** - works perfectly with serverless
- **Smaller bundle** size

### Why Prisma with Adapter instead of Drizzle?
- **Mature ecosystem** with libSQL adapter
- **Type-safe** generated client
- **Migration system** (even if not used with Turso directly)

---

**Document Version:** 1.0  
**Author:** CodeVibe Architect  
**Status:** Production Ready
