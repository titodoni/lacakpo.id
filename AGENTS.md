# PO Tracker (KreasiLog) - AGENTS.md

> **Project Status**: Active Development  
> **Language**: Indonesian (UI) + English (Code/Documentation)  
> **Last Updated**: 2026-02-22

---

## 1. Project Overview

**PO Tracker** (also referred to as **KreasiLog**) is a **Concurrent Multi-Department Manufacturing Progress Tracking System**. It enables multiple departments to track progress on the same Purchase Order (PO) items simultaneously without workflow locks or blocking.

### Key Differentiators
- **No Workflow Lock**: All departments can update progress anytime, no required sequence
- **Independent Progress**: Drafting 30%, Purchasing 80%, Production 50% — all valid concurrently
- **Auto-Audit Trail**: Every change is automatically logged by the system (who, when, from what to what)
- **Smart Input**: Slider + Quick Set (0/25/50/75/100) + Fine adjustment (-5%/+5%)
- **Dual PO System**: PO Internal (primary) + PO Client (optional reference)

### Concurrent Track Model Example
```
Item: Bearing SKF 6205
├── Track: Drafting     [████████░░] 80% (Budi)
├── Track: Purchasing   [██████████] 100% ✅ (Sari)
├── Track: Production   [█████░░░░░] 50% (Andi)
└── Track: QC           [░░░░░░░░░░] 0% (Waiting)

All tracks active simultaneously
No blocking between departments
```

---

## 2. Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **Language** | TypeScript | 5.x |
| **Database** | SQLite (local dev) / Turso (production) | - |
| **ORM** | Prisma | 5.22.0 |
| **Authentication** | Iron Session (stateless, username-only) | 8.0.4 |
| **Styling** | Tailwind CSS v4 + shadcn/ui (Zinc theme) | 4.x |
| **State Management** | Zustand + React Query | 5.x / 5.x |
| **Icons** | Lucide React | 0.575.0 |
| **Password Hashing** | bcryptjs | 3.0.3 |

### Performance Targets
- First load: < 2s (4G)
- API response: < 100ms
- Build size: < 200KB (initial)

---

## 3. Project Structure

```
app/
├── api/                      # API Routes
│   ├── admin/users/         # User management (admin only)
│   ├── auth/                # Authentication (login/logout/me)
│   ├── clients/             # Client CRUD
│   ├── dashboard/           # Dashboard statistics
│   ├── deliveries/          # Delivery management
│   ├── items/               # Item operations
│   ├── logs/                # Activity logs
│   ├── pos/                 # Purchase Orders
│   └── tracks/[trackId]/update/  # Progress update endpoint
├── admin/users/             # Admin user management page
├── deliveries/              # Delivery page
├── finance/                 # Finance view page
├── logs/                    # Activity logs page
├── login/                   # Login page
├── pos/                     # PO list and detail pages
│   ├── [id]/               # PO detail with TrackUpdateModal
│   └── new/                # Create new PO
├── profile/                 # User profile page
├── reports/                 # Statistics/reports page
├── tasks/                   # Department tasks page
├── globals.css              # Global styles + Tailwind
├── layout.tsx               # Root layout
├── not-found.tsx            # 404 page
└── page.tsx                 # Dashboard (home)

components/
├── ui/                      # shadcn/ui components (auto-generated)
├── ActivityLogItem.tsx      # Activity log display component
├── DashboardLayout.tsx      # Main app layout with sidebar/nav
├── SmartProgressInput.tsx   # Smart progress input component
├── StatCard.tsx             # Statistics card component
└── TrackCard.tsx            # Department track display card

hooks/
└── useUser.ts               # React hook for current user

lib/
├── auth.ts                  # Iron session configuration & helpers
├── prisma.ts                # Prisma client singleton
└── utils.ts                 # Utility functions (cn, formatters, role maps)

prisma/
├── schema.prisma            # Database schema definition
├── seed.ts                  # Seed data (users, clients)
└── seed-demo-data.ts        # Demo PO data seed

public/                      # Static assets
```

---

## 4. Database Schema

### Core Tables

#### `users` - User authentication & roles
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary Key |
| username | String | Unique, Not Null |
| password_hash | String | Not Null (bcrypt) |
| name | String | Not Null |
| role | String | See roles below |
| department | String | Not Null |
| is_active | Boolean | Default: true |
| created_at | DateTime | Default: now() |

**Roles**: `super_admin`, `manager`, `sales_admin`, `drafter`, `purchasing`, `cnc_operator`, `milling_operator`, `fab_operator`, `qc`, `delivery`, `finance`

#### `clients` - Client information
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary Key |
| code | String | Unique (e.g., "SA") |
| name | String | Not Null |
| contact_person | String | |
| phone | String | |
| address | String | |

#### `purchase_orders` - Dual PO system
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary Key |
| po_number | String | Unique, Internal: PO-2026-001 |
| client_po_number | String | Original from client (optional) |
| client_id | String | FK → clients(id) |
| po_date | DateTime | Not Null |
| delivery_deadline | DateTime | |
| notes | String | |
| status | String | active/completed/cancelled |
| is_urgent | Boolean | Default: false |
| created_by | String | FK → users(id) |

#### `items` - PO line items
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary Key |
| po_id | String | FK → purchase_orders(id), CASCADE DELETE |
| item_name | String | Not Null |
| specification | String | |
| quantity_total | Int | Not Null |
| quantity_unit | String | Default: 'pcs' |
| quantity_delivered | Int | Default: 0 |
| is_delivered | Boolean | Default: false |
| delivered_at | DateTime | |
| production_type | String | machining/fabrication/both |

#### `item_tracks` - Concurrent progress tracking (CORE)
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary Key |
| item_id | String | FK → items(id), CASCADE DELETE |
| department | String | drafting/purchasing/production/qc |
| progress | Int | Default: 0 (0-100) |
| updated_by | String | FK → users(id) |
| updated_at | DateTime | |
| last_note | String | |
| **UNIQUE** | | (item_id, department) |

#### `activity_logs` - Auto-generated audit trail
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary Key |
| item_id | String | FK → items(id) |
| track_id | String | FK → item_tracks(id) |
| actor_id | String | FK → users(id) |
| actor_name | String | Not Null (Snapshot) |
| actor_role | String | Not Null (Snapshot) |
| department | String | Not Null |
| action_type | String | Default: 'progress_update' |
| old_progress | Int | |
| new_progress | Int | |
| delta | Int | Difference (can be negative) |
| system_message | String | Auto-generated (Indonesian) |
| user_note | String | Optional |
| created_at | DateTime | |

#### `deliveries` - Delivery records
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary Key |
| item_id | String | FK → items(id) |
| quantity | Int | Not Null |
| delivery_date | DateTime | Not Null |
| surat_jalan_number | String | Delivery note number |
| notes | String | |
| delivered_by | String | FK → users(id) |

### Indexes
- `idx_items_po` on items(po_id)
- `idx_tracks_item` on item_tracks(item_id)
- `idx_tracks_dept` on item_tracks(department)
- `idx_logs_item` on activity_logs(item_id)
- `idx_logs_created` on activity_logs(created_at DESC)

---

## 5. Build and Test Commands

### Available Scripts (package.json)
```bash
npm run dev              # Start development server (Next.js dev)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run postinstall      # Prisma generate (auto-runs on npm install)
npm run db:migrate       # Prisma migrate dev
npm run db:deploy        # Prisma migrate deploy (production)
npm run db:seed          # Seed database with initial users/clients
npm run db:seed:demo     # Seed with demo PO data
npm run vercel-build     # Full build for Vercel (migrate + build)
```

### Local Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Set up environment
copy .env.local.example .env.local
# Edit .env.local with your values

# 3. Run database migrations
npm run db:migrate

# 4. Seed database
npm run db:seed

# 5. Start development server
npm run dev

# Open http://localhost:3000
```

### Pre-deployment Checks
```bash
npx tsc --noEmit          # TypeScript type check
npm run lint              # ESLint check
npm run build             # Test production build
```

---

## 6. Environment Variables

Create `.env.local` from `.env.local.example`:

```env
# Database - Local SQLite for development
DATABASE_URL="file:./dev.db"

# Or use Turso for production (recommended for Vercel)
# DATABASE_URL="libsql://your-db.turso.io"
# DATABASE_AUTH_TOKEN="your-turso-token"

# Session Secret (generate: openssl rand -base64 32)
SESSION_SECRET="your-32-char-secret-here"

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### Generate Secret Command
```bash
openssl rand -base64 32
```

---

## 7. Deployment

### Platform
**Vercel** (recommended)

### Build Configuration
- **Framework**: Next.js
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `.next`

### Vercel CLI Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Initialize project
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add DATABASE_AUTH_TOKEN
vercel env add SESSION_SECRET
vercel env add NEXT_PUBLIC_APP_URL

# Deploy to production
vercel --prod
```

### Post-Deployment
1. Run database migrations via Vercel Dashboard > Console
2. Seed initial data if needed

---

## 8. Code Style Guidelines

### Design System: Apple Minimalist + Manufacturing Optimized

#### Color System (Zinc Monochrome)
The project uses a monochrome zinc color palette defined in `app/globals.css`:

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--bg-page` | `#fafafa` | zinc-50 | Page background |
| `--bg-card` | `#ffffff` | white | Card backgrounds |
| `--text-primary` | `#18181b` | zinc-950 | Primary text |
| `--text-secondary` | `#71717a` | zinc-500 | Secondary text |
| `--accent-primary` | `#18181b` | zinc-900 | Buttons, active states |
| `--status-complete` | `#10b981` | emerald-500 | 100% progress only |

#### Progress Color Mapping (lib/utils.ts)
```typescript
function getProgressColor(progress: number): string {
  if (progress === 100) return 'bg-emerald-500';
  if (progress >= 76) return 'bg-zinc-600';
  if (progress >= 51) return 'bg-zinc-500';
  if (progress >= 26) return 'bg-zinc-400';
  return 'bg-zinc-300';
}
```

#### Touch Targets (CRITICAL for Manufacturing)
- Minimum: 44px (Apple HIG)
- Manufacturing optimal: 52px
- Primary actions: 56px

All buttons should use `active:scale-[0.98]` for press feedback.

#### Typography
- **Font**: System font stack (Geist via Next.js)
- **Monospace (numbers)**: `'SF Mono', SFMono-Regular, ui-monospace, monospace`
- **Progress Display**: 48px (text-5xl), font-mono, font-bold

#### Card Pattern
```css
bg-white rounded-2xl p-5 border border-zinc-200
```

#### Button Pattern
```css
/* Primary */
bg-zinc-900 text-white h-14 rounded-xl font-semibold
active:scale-[0.98] transition-transform

/* Secondary */
bg-zinc-100 text-zinc-700 h-12 rounded-xl
hover:bg-zinc-200 active:scale-[0.98]
```

### Component Conventions

1. **Use 'use client'** for interactive components (hooks, browser APIs)
2. **Server Components** by default for data fetching
3. **Path alias**: Use `@/` for imports (e.g., `@/lib/utils`, `@/components/ui`)
4. **Lucide icons**: Import from `lucide-react`
5. **Utility function**: Use `cn()` from `@/lib/utils` for conditional classes

---

## 9. Testing Instructions

### Test Login Credentials (After Seed)

| Role | Username | Password |
|------|----------|----------|
| **Super Admin** | admin | admin123 |
| **CNC Operator** | andi | andi123 |
| **Drafter** | budi | budi123 |
| **Purchasing** | sari | sari123 |
| **QC** | dewi | dewi123 |
| **Finance** | finance | finance123 |
| **Manager** | manager | manager123 |
| **Sales** | sales | sales123 |
| **Delivery** | delivery | delivery123 |

### Smoke Tests
1. Login as admin
2. Create PO with 2 items
3. Login as budi (drafter) → Update drafting 0→50%
4. Login as sari (purchasing) → Update purchasing 0→75%
5. Login as andi (cnc) → Update production 0→30%
6. Check activity logs showing all concurrent updates

---

## 10. User Roles & Permissions

| Role | Can Update Tracks | Can View All | Special Permissions |
|------|-------------------|--------------|---------------------|
| **super_admin** | Any (all departments) | ✅ Yes | Full access, user management |
| **manager** | None (View only) | ✅ Yes | Edit any |
| **sales_admin** | None | ✅ Yes | Create PO |
| **drafter** | Drafting | ✅ Yes | - |
| **purchasing** | Purchasing | ✅ Yes | - |
| **cnc_operator** | Production | ✅ Yes | - |
| **milling_operator** | Production | ✅ Yes | - |
| **fab_operator** | Production | ✅ Yes | - |
| **qc** | QC | ✅ Yes | Pass/Fail |
| **delivery** | None | ✅ Yes | Mark Delivered |
| **finance** | None | Delivered only | Mark Closed |

### Role-Track Mapping (lib/utils.ts)
```typescript
export const roleTrackMap: Record<string, string[]> = {
  super_admin: ['drafting', 'purchasing', 'production', 'qc'],
  manager: [],
  sales_admin: [],
  drafter: ['drafting'],
  purchasing: ['purchasing'],
  cnc_operator: ['production'],
  milling_operator: ['production'],
  fab_operator: ['production'],
  qc: ['qc'],
  delivery: [],
  finance: [],
};
```

---

## 11. API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/logout` | Logout | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/dashboard` | Dashboard statistics | Yes |
| GET | `/api/pos` | List all POs | Yes |
| POST | `/api/pos` | Create new PO | Yes (sales_admin/admin) |
| GET | `/api/pos/[id]` | Get PO details | Yes |
| GET | `/api/items` | List items | Yes |
| GET | `/api/items/[itemId]` | Get item with tracks | Yes |
| POST | `/api/tracks/[trackId]/update` | Update progress | Yes (role-based) |
| GET | `/api/logs` | Get activity logs | Yes |
| GET | `/api/clients` | List clients | Yes |
| GET | `/api/admin/users` | List all users | Yes (admin only) |

---

## 12. Authentication & Middleware

### Session Configuration (lib/auth.ts)
- **Cookie Name**: `project-tracking-session`
- **Max Age**: 24 hours
- **Security**: httpOnly, secure in production, sameSite=strict

### Middleware (middleware.ts)
- Protects all routes except `/login`, `/api/auth/login`, `/api/auth/logout`
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from `/login` to `/`
- Allows static assets (`/_next`, `/favicon`)

### Auth Helpers
```typescript
// lib/auth.ts
getSession()      // Get current session from cookies
requireAuth()     // Ensure user is logged in
requireRole([])   // Ensure user has specific role
```

---

## 13. Security Considerations

### Implemented Security Measures
- ✅ **SESSION_SECRET** required (32+ characters)
- ✅ **Cookies**: httpOnly, secure, sameSite=strict
- ✅ **API routes**: Protected with `requireAuth`
- ✅ **Role-based access**: Strict role checking on track updates
- ✅ **SQL injection**: Protected via Prisma ORM
- ✅ **XSS**: Protected via React auto-escaping
- ✅ **Password hashing**: bcryptjs with salt rounds

### Security Checklist for Production
- [ ] Use strong SESSION_SECRET (openssl rand -base64 32)
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS only
- [ ] Implement rate limiting on login API
- [ ] Regular database backups

---

## 14. Key Files Reference

| File | Purpose |
|------|---------|
| `lib/auth.ts` | Session config, auth helpers |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/utils.ts` | cn(), formatters, role maps |
| `middleware.ts` | Route protection |
| `prisma/schema.prisma` | Database schema |
| `components/DashboardLayout.tsx` | Main app shell |
| `components/SmartProgressInput.tsx` | Progress update UI |
| `components/TrackCard.tsx` | Department track display |

---

## 15. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Session Secret Missing" | Add SESSION_SECRET to .env.local |
| "Database connection failed" | Check DATABASE_URL format |
| "Prisma Client not found" | Run `npx prisma generate` |
| "Build failed - Type errors" | Run `npx tsc --noEmit` locally |
| "Middleware deprecation warning" | Known issue in Next.js 16+, still works |

### Database Commands
```bash
# Reset database
npx prisma migrate reset

# View database
npx prisma studio

# Generate migration
npx prisma migrate dev --name description
```

---

## 16. Documentation Files

| File | Description |
|------|-------------|
| `docs/build.md` | Build & Deployment Guide |
| `docs/pmd.md` | Project Management Document - Architecture, Schema, API |
| `docs/ui.md` | UI/UX Design System - Components, Colors, Layouts |

---

*Document Version: 1.1*  
*Status: Active Development*
