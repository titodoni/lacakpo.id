# PO Tracker (KreasiLog / lacakPO.id) - AGENTS.md

> **Project Status**: Production Ready  
> **Language**: Indonesian (UI) + English (Code/Documentation)  
> **Last Updated**: 2026-02-25

---

## 1. Project Overview

**PO Tracker** (also referred to as **KreasiLog** or **lacakPO.id**) is a **Concurrent Multi-Department Manufacturing Progress Tracking System**. It enables multiple departments to track progress on the same Purchase Order (PO) items simultaneously without workflow locks or blocking.

### Key Differentiators
- **No Workflow Lock**: All departments can update progress anytime, no required sequence
- **Independent Progress**: Drafting 30%, Purchasing 80%, Production 50% — all valid concurrently
- **Auto-Audit Trail**: Every change is automatically logged by the system (who, when, from what to what)
- **Smart Input**: Slider + Quick Set (0/25/50/75/100) + Fine adjustment (-5%/+5%)
- **Dual PO System**: PO Internal (primary) + PO Client (optional reference)
- **Issue Tracking**: Built-in issue reporting and resolution system
- **Finance Integration**: Invoicing and payment tracking
- **Vendor Job Support**: POs can be marked as vendor jobs (external production)
- **Multi-Theme System**: 4 premium themes with runtime switching

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
| **Framework** | Next.js (App Router) | 14.2.21 |
| **Language** | TypeScript | 5.x |
| **Database** | SQLite (local dev) / Turso (production) | - |
| **ORM** | Prisma | 5.22.0 |
| **Authentication** | Iron Session (stateless, username-only) | 8.0.4 |
| **Styling** | Tailwind CSS v4 + shadcn/ui | 4.x |
| **State Management** | Zustand + React Query (TanStack Query) | 5.0.11 / 5.90.21 |
| **Icons** | Lucide React | 0.575.0 |
| **Password Hashing** | bcryptjs | 3.0.3 |
| **Build Tool** | Next.js Built-in | - |

### Performance Targets
- First load: < 2s (4G)
- API response: < 100ms
- Build size: < 200KB (initial)

---

## 3. Project Structure

```
app/
├── api/                      # API Routes (RESTful)
│   ├── admin/
│   │   ├── reset-data/      # Reset data endpoint (admin only)
│   │   └── users/           # User management (admin only)
│   ├── auth/                # Authentication (login/logout/me)
│   ├── clients/             # Client CRUD
│   ├── dashboard/           # Dashboard statistics
│   ├── deliveries/          # Delivery management
│   ├── issues/              # Issue reporting and resolution
│   ├── items/               # Item operations (delivery, issues, details)
│   ├── logs/                # Activity logs
│   ├── pos/                 # Purchase Orders CRUD + finance
│   ├── reports/dashboard/   # Statistics/reporting
│   ├── search/              # Global search
│   ├── tracks/[trackId]/update/  # Progress update endpoint
│   └── users/               # User list (public for login)
├── admin/users/             # Admin user management page
├── deliveries/              # Delivery page
├── finance/                 # Finance view page
├── issues/                  # Issues list page
├── logs/                    # Activity logs page
├── login/                   # Login page
├── pos/                     # PO list and detail pages
│   ├── [id]/               # PO detail with TrackUpdateModal
│   ├── [id]/edit/          # Edit PO page
│   └── new/                # Create new PO
├── profile/                 # User profile page
├── reports/                 # Statistics/reports page
├── search/                  # Global search page
├── tasks/                   # Department tasks page
├── globals.css              # Global styles + Tailwind v4 + color tokens
├── layout.tsx               # Root layout with ThemeProvider
├── not-found.tsx            # 404 page
└── page.tsx                 # Dashboard (home) with role-based redirects

components/
├── ui/                      # shadcn/ui components (auto-generated)
├── reports/                 # Report-specific components
│   ├── DelayedItemsTable.tsx
│   ├── FinishedTable.tsx
│   ├── OngoingTable.tsx
│   ├── ProblemsTable.tsx
│   ├── ReportsDashboard.tsx
│   └── ReportsDashboardSkeleton.tsx
├── ActivityLogItem.tsx      # Activity log display component
├── CompactProgressInput.tsx # Compact progress input for mobile
├── DashboardLayout.tsx      # Main app layout with sidebar/nav
├── IssueBadge.tsx           # Issue priority badge component
├── IssueList.tsx            # Issue list display component
├── ItemCard.tsx             # Item card component
├── PaletteOptions.tsx       # Theme switcher component
├── ReportIssueModal.tsx     # Issue reporting modal
├── SmartProgressInput.tsx   # Smart progress input component
├── StatCard.tsx             # Statistics card component
└── TrackCard.tsx            # Department track display card

hooks/
└── useUser.ts               # React hook for current user

lib/
├── themes/                  # Theme system
│   ├── color-palette-engine.ts  # 4 premium theme definitions
│   ├── globals-themes.css       # Theme CSS variables
│   ├── index.ts                 # Theme barrel exports
│   ├── ThemeProvider.tsx        # Theme context provider
│   └── USAGE_GUIDE.md           # Theme usage documentation
├── auth.ts                  # Iron session configuration & helpers
├── department-info.ts       # Department explanations and milestones
├── error-codes.ts           # Error code system for user-friendly messages
├── prisma.ts                # Prisma client singleton
└── utils.ts                 # Utility functions (cn, formatters, role maps)

prisma/
├── schema.prisma            # Database schema definition
├── migrations/              # Database migrations
├── seed.ts                  # Seed data (users, clients) - password: demo
├── seed-demo-data.ts        # Demo PO data seed
├── seed-new-data.ts         # Additional seed data
└── reset-passwords.ts       # Reset all passwords utility

public/                      # Static assets
docs/                        # Documentation (pmd.md, ui.md, build.md, deploy.md)
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
| status | String | active/completed/cancelled/archived/finished |
| is_urgent | Boolean | Default: false |
| is_vendor_job | Boolean | Default: false (external vendor) |
| vendor_name | String | |
| vendor_phone | String | |
| vendor_estimation | DateTime | |
| is_invoiced | Boolean | Default: false |
| invoiced_at | DateTime | |
| invoice_number | String | |
| is_paid | Boolean | Default: false |
| paid_at | DateTime | |
| finished_at | DateTime | |
| created_by | String | FK → users(id) |
| created_at | DateTime | Default: now() |

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
| created_at | DateTime | Default: now() |

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
| created_at | DateTime | Default: now() |

#### `issues` - Issue tracking
| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary Key |
| item_id | String | FK → items(id), CASCADE DELETE |
| title | String | Not Null |
| description | String | |
| priority | String | high/medium/low |
| status | String | Default: 'open' (open/resolved) |
| created_by | String | FK → users(id) |
| created_at | DateTime | |
| updated_at | DateTime | |
| resolved_at | DateTime | |
| resolved_by | String | FK → users(id) |

### Indexes
- `idx_po_status` on purchase_orders(status)
- `idx_po_deadline` on purchase_orders(delivery_deadline)
- `idx_po_invoiced` on purchase_orders(is_invoiced)
- `idx_po_paid` on purchase_orders(is_paid)
- `idx_items_po` on items(po_id)
- `idx_tracks_item` on item_tracks(item_id)
- `idx_tracks_dept` on item_tracks(department)
- `idx_logs_item` on activity_logs(item_id)
- `idx_logs_created` on activity_logs(created_at DESC)
- `idx_issues_item` on issues(item_id)
- `idx_issues_status` on issues(status)

---

## 5. Build and Test Commands

### Available Scripts (package.json)
```bash
# Development
npm run dev              # Start development server (Next.js dev)

# Production
npm run build            # Build for production
npm run start            # Start production server
npm run vercel-build     # Full build for Vercel (prisma generate + build)

# Database
npm run db:migrate       # Prisma migrate dev
npm run db:deploy        # Prisma migrate deploy (production)
npm run db:seed          # Seed database with initial users/clients
npm run db:seed:demo     # Seed with demo PO data
npm run db:seed:new      # Seed with new additional data
npm run db:reset-passwords  # Reset all passwords to 'demo'

# Linting
npm run lint             # Run ESLint

# Bundle Analysis
npm run analyze          # Analyze bundle size with @next/bundle-analyzer
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

### Design System (Multi-Theme)

The project uses a **dynamic theme system** with 4 premium themes defined in `lib/themes/color-palette-engine.ts`:

1. **ocean-flame** (default) - Blue-green + Orange
2. **midnight-ember** - Prussian blue + Warm orange
3. **teal-gold-luxe** - Pine teal + Metallic gold
4. **warm-ivory** - Khaki beige + Tangerine

### Semantic Color Tokens
Each theme provides these semantic tokens via CSS variables:
- `--background`, `--foreground` - Base colors
- `--primary`, `--primary-foreground`, `--primary-hover` - Brand primary
- `--secondary`, `--secondary-foreground` - Secondary actions
- `--accent`, `--accent-foreground`, `--accent-hover` - CTAs and highlights
- `--muted`, `--muted-foreground` - Subtle backgrounds
- `--card`, `--card-foreground` - Card surfaces
- `--border`, `--input`, `--ring` - Form elements
- `--destructive`, `--success`, `--warning`, `--info` - Status colors
- `--sidebar-*` - Sidebar specific tokens

### Progress Color Mapping (lib/utils.ts)
```typescript
function getProgressColor(progress: number): string {
  if (progress === 100) return 'bg-emerald-500';
  if (progress >= 76) return 'bg-zinc-600';
  if (progress >= 51) return 'bg-zinc-500';
  if (progress >= 26) return 'bg-zinc-400';
  return 'bg-zinc-300';
}
```

### Touch Targets (Manufacturing Optimized)
- Minimum: 44px (Apple HIG)
- Manufacturing optimal: 52px
- Primary actions: 56px

### Component Conventions

1. **Use 'use client'** for interactive components (hooks, browser APIs)
2. **Server Components** by default for data fetching
3. **Path alias**: Use `@/` for imports (e.g., `@/lib/utils`, `@/components/ui`)
4. **Lucide icons**: Import from `lucide-react`
5. **Utility function**: Use `cn()` from `@/lib/utils` for conditional classes
6. **Error handling**: Use error codes from `lib/error-codes.ts` for user-friendly messages

### Card Pattern
```css
bg-white rounded-2xl p-5 border border-zinc-200
```

### Button Pattern
```css
/* Primary */
bg-primary text-primary-foreground h-14 rounded-xl font-semibold
active:scale-[0.98] transition-transform

/* Secondary */
bg-muted text-foreground h-12 rounded-xl
hover:bg-muted/80 active:scale-[0.98]
```

---

## 9. Testing Instructions

### Test Login Credentials (After Seed)

| Role | Username | Password |
|------|----------|----------|
| **Super Admin** | admin | demo |
| **Manager** | manager | demo |
| **Sales** | sales | demo |
| **Drafter** | budi | demo |
| **Purchasing** | sari | demo |
| **CNC Operator** | andi | demo |
| **QC** | dewi | demo |
| **Finance** | finance | demo |
| **Delivery** | delivery | demo |

---

## 10. User Roles & Permissions

| Role | Can Update Tracks | Can View All | Special Permissions |
|------|-------------------|--------------|---------------------|
| **super_admin** | Any (all departments) | ✅ Yes | Full access, user management |
| **manager** | None (View only) | ✅ Yes | Edit any, view reports |
| **sales_admin** | None | ✅ Yes | Create PO, edit own POs |
| **drafter** | Drafting | ✅ Yes | - |
| **purchasing** | Purchasing | ✅ Yes | - |
| **cnc_operator** | Production | ✅ Yes | - |
| **milling_operator** | Production | ✅ Yes | - |
| **fab_operator** | Production | ✅ Yes | - |
| **qc** | QC | ✅ Yes | Pass/Fail |
| **delivery** | Delivery | ✅ Yes | Mark Delivered |
| **finance** | None | Delivered only | Mark Invoiced/Paid |

### Role-Track Mapping (lib/utils.ts)
```typescript
export const roleTrackMap: Record<string, string[]> = {
  super_admin: [],  // Can update any via admin override
  manager: [],
  sales_admin: [],
  drafter: ['drafting'],
  purchasing: ['purchasing'],
  cnc_operator: ['production'],
  milling_operator: ['production'],
  fab_operator: ['production'],
  qc: ['qc'],
  delivery: ['delivery'],
  finance: [],
};
```

### Department Milestones (lib/department-info.ts)

Each department has defined milestones for progress tracking:

- **Drafting**: 0% Belum mulai → 25% Draft awal → 50% Gambar 2D/3D → 75% Review internal → 100% Gambar ACC client
- **Purchasing**: 0% Belum mulai → 25% RFQ ke supplier → 50% PO ke supplier → 75% Material OTW → 100% Material tiba di gudang
- **Production**: 0% Belum mulai → 25% Setup mesin → 50% Proses machining/fabrication → 75% Finishing → 100% Selesai produksi
- **QC**: 0% Belum mulai → 25% Inspeksi dimensi → 50% Inspeksi visual → 75% Testing → 100% Lolos QC, siap kirim
- **Delivery**: 0% Belum siap kirim → 25% Persiapan dokumen → 50% Packing → 75% Dalam pengiriman → 100% Terkirim ke client

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
| PATCH | `/api/pos/[id]` | Update PO | Yes (admin/sales_admin) |
| DELETE | `/api/pos/[id]` | Delete PO | Yes (admin only) |
| GET | `/api/pos/[id]/finance` | Get PO finance status | Yes |
| PATCH | `/api/pos/[id]/finance` | Update finance status | Yes (finance/admin) |
| GET | `/api/items` | List items | Yes |
| GET | `/api/items/[itemId]` | Get item with tracks | Yes |
| POST | `/api/items/[itemId]/delivery` | Record delivery | Yes (delivery/admin) |
| GET | `/api/items/[itemId]/issues` | Get item issues | Yes |
| POST | `/api/items/[itemId]/issues` | Report issue | Yes |
| POST | `/api/tracks/[trackId]/update` | Update progress | Yes (role-based) |
| GET | `/api/logs` | Get activity logs | Yes |
| GET | `/api/clients` | List clients | Yes |
| GET | `/api/deliveries` | List deliveries | Yes |
| GET | `/api/issues` | List issues | Yes |
| PATCH | `/api/issues/[issueId]` | Update issue status | Yes |
| GET | `/api/search` | Global search | Yes |
| POST | `/api/admin/reset-data` | Reset all data | Yes (admin only) |
| GET | `/api/admin/users` | List all users | Yes (admin only) |
| POST | `/api/admin/users` | Create user | Yes (admin only) |
| PATCH | `/api/admin/users/[id]` | Update user | Yes (admin only) |
| DELETE | `/api/admin/users/[id]` | Delete user | Yes (admin only) |
| GET | `/api/users` | List users (basic) | Yes (public param for login) |

---

## 12. Authentication & Session

### Session Configuration (lib/auth.ts)
- **Cookie Name**: `project-tracking-session`
- **Max Age**: 24 hours (60 * 60 * 24 seconds)
- **Security**: httpOnly, secure in production, sameSite=strict

### Auth Helpers
```typescript
// lib/auth.ts
getSession()      // Get current session from cookies
requireAuth()     // Ensure user is logged in
requireRole([])   // Ensure user has specific role
```

### Session Data Structure
```typescript
interface SessionData {
  userId: string;
  username: string;
  role: string;
  department: string;
  name: string;
  isLoggedIn: boolean;
}
```

---

## 13. Error Code System

The project uses a centralized error code system in `lib/error-codes.ts` for consistent user-friendly error messages.

### Error Code Format
- `ERR_000-099`: General errors
- `ERR_100-199`: PO-related errors
- `ERR_200-299`: Finance errors
- `ERR_300-399`: User/Auth errors
- `ERR_400-499`: Track/Progress errors
- `ERR_500-599`: Delivery errors

### Usage Example
```typescript
import { getErrorDetails, formatErrorMessage } from '@/lib/error-codes';

// In API route
return NextResponse.json(
  { error: 'ERR_007', message: 'Forbidden' },
  { status: 403 }
);

// In component
const errorMessage = formatErrorMessage({ error: 'ERR_007' });
```

---

## 14. Theme System

The project features a sophisticated **runtime theme switching system** with 4 premium themes.

### Theme Files
- `lib/themes/color-palette-engine.ts` - Theme definitions and color scales
- `lib/themes/ThemeProvider.tsx` - React context for theme state
- `lib/themes/globals-themes.css` - Generated CSS variables
- `components/PaletteOptions.tsx` - Theme switcher UI

### Available Themes
1. **Ocean Flame** (`ocean-flame`) - Vibrant blue-green with warm orange accent
2. **Midnight Ember** (`midnight-ember`) - Sophisticated dark blue with ember glow
3. **Teal Gold Luxe** (`teal-gold-luxe`) - Rich pine teal with metallic gold
4. **Warm Ivory** (`warm-ivory`) - Warm inviting beige with tangerine

### Using Themes
```typescript
import { useTheme, ThemeSwitcher } from '@/lib/themes';

// Get current theme
const { theme, setTheme, availableThemes } = useTheme();

// Set theme
setTheme('midnight-ember');

// Use theme colors in components (via CSS variables)
// bg-primary, text-primary-foreground, etc.
```

---

## 15. Security Considerations

### Implemented Security Measures
- ✅ **SESSION_SECRET** required (32+ characters)
- ✅ **Cookies**: httpOnly, secure, sameSite=strict
- ✅ **API routes**: Protected with `requireAuth`
- ✅ **Role-based access**: Strict role checking on track updates
- ✅ **SQL injection**: Protected via Prisma ORM
- ✅ **XSS**: Protected via React auto-escaping
- ✅ **Password hashing**: bcryptjs with salt rounds
- ✅ **Vendor job lock**: Production cannot update if PO is vendor job

### Security Checklist for Production
- [ ] Use strong SESSION_SECRET (openssl rand -base64 32)
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS only
- [ ] Implement rate limiting on login API
- [ ] Regular database backups

---

## 16. Key Files Reference

| File | Purpose |
|------|---------|
| `lib/auth.ts` | Session config, auth helpers |
| `lib/prisma.ts` | Prisma client singleton |
| `lib/utils.ts` | cn(), formatters, role maps, progress colors |
| `lib/department-info.ts` | Department milestones and explanations |
| `lib/error-codes.ts` | Error code system |
| `lib/themes/color-palette-engine.ts` | Theme definitions |
| `lib/themes/ThemeProvider.tsx` | Theme context provider |
| `prisma/schema.prisma` | Database schema |
| `components/DashboardLayout.tsx` | Main app shell with navigation |
| `components/SmartProgressInput.tsx` | Progress update UI |
| `components/TrackCard.tsx` | Department track display |
| `app/page.tsx` | Dashboard with role-based redirects |

---

## 17. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Session Secret Missing" | Add SESSION_SECRET to .env.local |
| "Database connection failed" | Check DATABASE_URL format |
| "Prisma Client not found" | Run `npx prisma generate` |
| "Build failed - Type errors" | Run `npx tsc --noEmit` locally |
| "Cannot update production track" | Check if PO is marked as vendor job |

### Database Commands
```bash
# Reset database
npx prisma migrate reset

# View database
npx prisma studio

# Generate migration
npx prisma migrate dev --name description

# Reset all passwords to 'demo'
npm run db:reset-passwords
```

---

## 18. Documentation Files

| File | Description |
|------|-------------|
| `docs/build.md` | Build & Deployment Guide |
| `docs/pmd.md` | Project Management Document - Architecture, Schema, API |
| `docs/ui.md` | UI/UX Design System - Components, Colors, Layouts |
| `docs/deploy.md` | Deployment-specific instructions |

---

*Document Version: 2.0*  
*Status: Production Ready*
