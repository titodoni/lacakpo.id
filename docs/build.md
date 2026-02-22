Final Build & Deployment Guide
Production Deployment to Vercel
System: Concurrent Manufacturing Tracker
Database: SQLite (Turso) | Auth: Username-Only | Deploy: Vercel
1. PRE-DEPLOYMENT CHECKLIST
1.1 Code Quality
bash
Copy
# Run these before deployment
npx tsc --noEmit          # TypeScript check
npm run lint              # ESLint
npm run build             # Build test
npx prisma generate       # Generate Prisma client
1.2 Environment Variables
Create .env.local:
env
Copy
# Database (Turso - Recommended for Vercel)
DATABASE_URL="libsql://your-db.turso.io"
DATABASE_AUTH_TOKEN="your-turso-token"

# Or use Vercel Postgres
# DATABASE_URL="postgres://..."

# Session Secret (generate: openssl rand -base64 32)
SESSION_SECRET="your-32-char-secret-here"

# App Config
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NODE_ENV="production"
Generate Secret:
bash
Copy
openssl rand -base64 32
2. DATABASE SETUP
2.1 Turso (SQLite) - Recommended
bash
Copy
# 1. Install CLI
npm install -g @tursodatabase/turso

# 2. Login
turso login

# 3. Create database
turso db create project-tracking-prod

# 4. Get connection URL
turso db show project-tracking-prod
# Copy URL: libsql://kreasilog-prod-youruser.turso.io

# 5. Create auth token
turso db tokens create project-tracking-prod

# 6. Add to Vercel env vars (see below)
2.2 Schema Migration
bash
Copy
# Development
npx prisma migrate dev --name init

# Production (run once after deploy)
npx prisma migrate deploy
3. NEXT.JS CONFIGURATION
next.config.js
JavaScript
Copy
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    domains: ['localhost'],
    unoptimized: true, // For static export compatibility
  },

  experimental: {
    serverActions: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
package.json Scripts
JSON
Copy
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
4. AUTHENTICATION IMPLEMENTATION
4.1 Iron Session Setup
lib/auth.ts:
TypeScript
Copy
import { getIronSession, IronSessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId: string;
  username: string;
  role: string;
  isLoggedIn: boolean;
}

export const sessionOptions: IronSessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'project-tracking-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

export async function getSession() {
  const cookieStore = cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    throw new Error('Unauthorized');
  }
  return session;
}
4.2 Login API
app/api/auth/login/route.ts:
TypeScript
Copy
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.role = user.role;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
4.3 Middleware
middleware.ts:
TypeScript
Copy
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from './lib/auth';

export async function middleware(request: NextRequest) {
  const session = await getIronSession(request.cookies, sessionOptions);

  const publicPaths = ['/login', '/api/auth/login'];
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
5. DATABASE SEEDING
prisma/seed.ts
TypeScript
Copy
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      name: 'Administrator',
      role: 'super_admin',
      department: 'management',
      isActive: true,
    },
  });

  console.log('Created admin (username: admin, password: admin123)');

  // Create sample operators
  const operators = [
    { username: 'andi', name: 'Andi CNC', role: 'cnc_operator', dept: 'production' },
    { username: 'budi', name: 'Budi Drafter', role: 'drafter', dept: 'drafting' },
    { username: 'sari', name: 'Sari Purchasing', role: 'purchasing', dept: 'purchasing' },
    { username: 'dewi', name: 'Dewi QC', role: 'qc', dept: 'qc' },
    { username: 'finance', name: 'Finance Admin', role: 'finance', dept: 'finance' },
  ];

  for (const op of operators) {
    const password = await bcrypt.hash(op.username + '123', 10);
    await prisma.user.upsert({
      where: { username: op.username },
      update: {},
      create: {
        username: op.username,
        passwordHash: password,
        name: op.name,
        role: op.role,
        department: op.dept,
        isActive: true,
      },
    });
    console.log(`Created ${op.username} / ${op.username}123`);
  }

  // Sample clients
  await prisma.client.createMany({
    data: [
      { code: 'SA', name: 'PT Sinar Abadi', contactPerson: 'Pak Ahmad', phone: '021-5550101' },
      { code: 'DP', name: 'PT Delta Prima', contactPerson: 'Ibu Sari', phone: '021-5550202' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
6. VERCEL DEPLOYMENT
6.1 Using Vercel CLI
bash
Copy
# Install
npm i -g vercel

# Login
vercel login

# Initialize
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add DATABASE_AUTH_TOKEN
vercel env add SESSION_SECRET

# Deploy
vercel --prod
6.2 Using Git Integration (Recommended)
Push code to GitHub
Import project in vercel.com
Configure:
Framework: Next.js
Build Command: npm run vercel-build
Output Directory: .next
Add Environment Variables in Dashboard
Deploy
6.3 Environment Variables in Dashboard
Table
Copy
Key	Value	Environment
DATABASE_URL	libsql://...	Production
DATABASE_AUTH_TOKEN	your-token	Production
SESSION_SECRET	your-secret	Production
NEXT_PUBLIC_APP_URL	https://...	Production
7. POST-DEPLOYMENT
7.1 Run Seed
bash
Copy
# Via Vercel Dashboard > Console
npx prisma db seed
7.2 Test Login Credentials
plain
Copy
Admin:     admin / admin123
CNC:       andi / andi123
Drafter:   budi / budi123
Purchasing: sari / sari123
QC:        dewi / dewi123
Finance:   finance / finance123
7.3 Smoke Tests
Login sebagai admin
Create PO dengan 2 items
Login sebagai budi (drafter) → Update drafting 0→50%
Login sebagai sari (purchasing) → Update purchasing 0→75%
Login sebagai andi (cnc) → Update production 0→30%
Check activity logs showing all concurrent updates
8. TROUBLESHOOTING
Issue: "Session Secret Missing"
Fix: Add SESSION_SECRET to Vercel environment variables
Issue: "Database connection failed"
Fix: Check Turso token validity, regenerate if needed:
bash
Copy
turso db tokens create project-tracking-prod
Issue: "Prisma Client not found"
Fix: Ensure postinstall script in package.json:
JSON
Copy
"postinstall": "prisma generate"
Issue: "Build failed - Type errors"
Fix: Run locally first:
bash
Copy
npx tsc --noEmit
9. MAINTENANCE
Backup Database
bash
Copy
# Turso dump
turso db shell project-tracking-prod ".dump" > backup-$(date +%Y%m%d).sql
Monitor Logs
Vercel Dashboard > Logs
Check for auth failures
Database connection errors
Updates
bash
Copy
# Update dependencies
npm update

# Test locally before deploy
npm run build

# Deploy
vercel --prod
10. SECURITY CHECKLIST
[ ] SESSION_SECRET is 32+ random characters
[ ] Cookies: httpOnly, secure, sameSite=strict
[ ] API routes protected with requireAuth
[ ] Input validation on all forms (zod recommended)
[ ] SQL injection protected (Prisma ORM)
[ ] XSS protected (React auto-escape)
[ ] Rate limiting on login (implement middleware)
Deployment Complete!
Your Project tracking is now live with:
✅ Concurrent department tracking
✅ Auto-generated activity logs
✅ Smart progress input (Quick Set + Fine adjust)
✅ Dual PO number system
✅ Username-only authentication
✅ Apple minimalist design
End of Deployment Guide