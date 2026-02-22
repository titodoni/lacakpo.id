# KreasiLog - AGENTS.md

> **Project Status**: Planning Phase (Documentation Only)  
> **Language**: Documentation is in Indonesian and English  
> **Last Updated**: 2026-02-21

---

## 1. Project Overview

**KreasiLog** is a **Concurrent Multi-Department Manufacturing Progress Tracking System**. It enables multiple departments to track progress on the same Purchase Order (PO) items simultaneously without workflow locks or blocking.

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

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | SQLite (Turso/libSQL) or Vercel Postgres |
| **ORM** | Prisma |
| **Authentication** | Iron Session (stateless, username-only) |
| **Styling** | Tailwind CSS + shadcn/ui (Zinc theme) |
| **State Management** | Zustand + React Query |
| **Icons** | Lucide React |

### Performance Targets
- First load: < 2s (4G)
- API response: < 100ms
- Build size: < 200KB (initial)

---

## 3. Project Structure (Planned)

```
app/
├── api/
│   ├── auth/
│   │   └── login/
│   │       └── route.ts
│   ├── items/
│   │   └── [itemId]/
│   │       ├── route.ts
│   │       └── logs/
│   │           └── route.ts
│   ├── tracks/
│   │   └── [trackId]/
│   │       └── update/
│   │           └── route.ts
│   └── pos/
│       └── route.ts
├── layout.tsx
├── page.tsx
├── login/
│   └── page.tsx
└── ...

components/
├── ui/              # shadcn/ui components
├── SmartProgressInput.tsx
├── TrackCard.tsx
└── ...

lib/
├── auth.ts          # Iron session configuration
├── prisma.ts        # Prisma client
└── utils.ts

prisma/
├── schema.prisma    # Database schema
└── seed.ts          # Seed data

public/
└── ...
```

---

## 4. Database Schema

### Core Tables

#### `users` - User authentication & roles
| Field | Type | Notes |
|-------|------|-------|
| id | TEXT | Primary Key |
| username | TEXT | Unique, Not Null |
| password_hash | TEXT | Not Null |
| name | TEXT | Not Null |
| role | TEXT | See roles below |
| department | TEXT | Not Null |
| is_active | BOOLEAN | Default: true |
| created_at | DATETIME | Default: CURRENT_TIMESTAMP |

**Roles**: `super_admin`, `manager`, `sales_admin`, `drafter`, `purchasing`, `cnc_operator`, `milling_operator`, `fab_operator`, `qc`, `delivery`, `finance`

#### `clients` - Client information
| Field | Type | Notes |
|-------|------|-------|
| id | TEXT | Primary Key |
| code | TEXT | Unique (e.g., "SA") |
| name | TEXT | Not Null |
| contact_person | TEXT | |
| phone | TEXT | |
| address | TEXT | |

#### `purchase_orders` - Dual PO system
| Field | Type | Notes |
|-------|------|-------|
| id | TEXT | Primary Key |
| po_number | TEXT | Unique, Internal: PO-2026-001 |
| client_po_number | TEXT | Original from client (optional) |
| client_id | TEXT | FK → clients(id) |
| po_date | DATE | Not Null |
| delivery_deadline | DATE | |
| notes | TEXT | |
| status | TEXT | active/completed/cancelled |
| created_by | TEXT | FK → users(id) |

#### `items` - PO line items
| Field | Type | Notes |
|-------|------|-------|
| id | TEXT | Primary Key |
| po_id | TEXT | FK → purchase_orders(id), CASCADE DELETE |
| item_name | TEXT | Not Null |
| specification | TEXT | |
| quantity_total | INTEGER | Not Null |
| quantity_unit | TEXT | Default: 'pcs' |
| quantity_delivered | INTEGER | Default: 0 |
| is_delivered | BOOLEAN | Default: false |
| delivered_at | DATETIME | |

#### `item_tracks` - Concurrent progress tracking (CORE)
| Field | Type | Notes |
|-------|------|-------|
| id | TEXT | Primary Key |
| item_id | TEXT | FK → items(id), CASCADE DELETE |
| department | TEXT | drafting/purchasing/production/qc |
| progress | INTEGER | Default: 0 (0-100) |
| updated_by | TEXT | FK → users(id) |
| updated_at | DATETIME | |
| last_note | TEXT | |
| **UNIQUE** | | (item_id, department) |

#### `activity_logs` - Auto-generated audit trail
| Field | Type | Notes |
|-------|------|-------|
| id | TEXT | Primary Key |
| item_id | TEXT | FK → items(id) |
| track_id | TEXT | FK → item_tracks(id) |
| actor_id | TEXT | FK → users(id) |
| actor_name | TEXT | Not Null (Snapshot) |
| actor_role | TEXT | Not Null (Snapshot) |
| department | TEXT | Not Null |
| action_type | TEXT | Default: 'progress_update' |
| old_progress | INTEGER | |
| new_progress | INTEGER | |
| delta | INTEGER | Difference (can be negative) |
| system_message | TEXT | Auto-generated |
| user_note | TEXT | Optional |
| created_at | DATETIME | |

#### `deliveries` - Delivery records
| Field | Type | Notes |
|-------|------|-------|
| id | TEXT | Primary Key |
| item_id | TEXT | FK → items(id) |
| quantity | INTEGER | Not Null |
| delivery_date | DATE | Not Null |
| surat_jalan_number | TEXT | |
| notes | TEXT | |
| delivered_by | TEXT | FK → users(id) |

### Indexes
- `idx_items_po` on items(po_id)
- `idx_tracks_item` on item_tracks(item_id)
- `idx_tracks_dept` on item_tracks(department)
- `idx_logs_item` on activity_logs(item_id)
- `idx_logs_created` on activity_logs(created_at DESC)

---

## 5. Build and Test Commands

### package.json Scripts
```json
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
```

### Local Development
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
```

### Database Operations
```bash
npx prisma migrate dev --name init     # Development migration
npx prisma migrate deploy              # Production migration
npx prisma db seed                     # Seed database
npx prisma generate                    # Generate Prisma client
```

### Pre-deployment Checks
```bash
npx tsc --noEmit          # TypeScript check
npm run lint              # ESLint
npm run build             # Build test
npx prisma generate       # Generate Prisma client
```

---

## 6. Environment Variables

Create `.env.local`:

```env
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
```

### Post-Deployment
```bash
# Run seed via Vercel Dashboard > Console
npx prisma db seed
```

---

## 8. Code Style Guidelines

### Design System: Apple Minimalist + Manufacturing Optimized

#### Color System (Zinc Monochrome)
| Token | Hex | Tailwind |
|-------|-----|----------|
| `--bg-page` | `#fafafa` | zinc-50 |
| `--bg-card` | `#ffffff` | white |
| `--text-primary` | `#18181b` | zinc-950 |
| `--text-secondary` | `#71717a` | zinc-500 |
| `--accent-primary` | `#18181b` | zinc-900 |
| `--status-complete` | `#10b981` | emerald-500 |

#### Progress Color Mapping
| Range | Tailwind |
|-------|----------|
| 0-25% | zinc-300 |
| 26-50% | zinc-400 |
| 51-75% | zinc-500 |
| 76-99% | zinc-600 |
| 100% | emerald-500 |

#### Touch Targets (CRITICAL for Manufacturing)
- Minimum: 44px (Apple HIG)
- Manufacturing optimal: 52px
- Primary actions: 56px

#### Typography
- **Font**: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- **Monospace (numbers)**: `'SF Mono', SFMono-Regular, ui-monospace, monospace`
- **Progress Display**: 48px, font-mono, font-bold

### Component Patterns

#### Card
```css
background: #ffffff;
border-radius: 16px;
padding: 20px;
border: 1px solid #e4e4e7;
box-shadow: 0 1px 3px rgba(0,0,0,0.04);
```

#### Primary Button
```css
background: #18181b;
color: #ffffff;
height: 56px;
border-radius: 12px;
font-size: 16px;
font-weight: 600;
width: 100%;
/* Active: transform: scale(0.98) */
```

#### Input
```css
height: 52px;
border-radius: 12px;
border: 1px solid #d4d4d8;
font-size: 16px; /* Prevents iOS zoom */
```

---

## 9. Testing Instructions

### Test Login Credentials (After Seed)

| Role | Username | Password |
|------|----------|----------|
| **Admin** | admin | admin123 |
| **CNC Operator** | andi | andi123 |
| **Drafter** | budi | budi123 |
| **Purchasing** | sari | sari123 |
| **QC** | dewi | dewi123 |
| **Finance** | finance | finance123 |

### Smoke Tests
1. Login sebagai admin
2. Create PO dengan 2 items
3. Login sebagai budi (drafter) → Update drafting 0→50%
4. Login sebagai sari (purchasing) → Update purchasing 0→75%
5. Login sebagai andi (cnc) → Update production 0→30%
6. Check activity logs showing all concurrent updates

---

## 10. User Roles & Permissions

| Role | Can Update Tracks | Can View All | Special Permissions |
|------|-------------------|--------------|---------------------|
| **super_admin** | Any (all departments) | ✅ Yes | Full access |
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

### Concurrent Update Rules
- Multiple operators (CNC, Milling, Fab) can all update the **Production** track
- Last write wins with timestamp
- Conflict resolution: If simultaneous updates within 1 second, use timestamp + user notification

---

## 11. API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/api/tracks/[trackId]/update` | Update progress | `{ newProgress: number, userNote?: string }` |
| GET | `/api/items/[itemId]` | Get item with tracks | - |
| GET | `/api/items/[itemId]/logs` | Get activity logs | Query: `?department=&limit=50` |
| POST | `/api/pos` | Create PO | `{ poNumber, clientPoNumber?, clientId, items[] }` |
| POST | `/api/auth/login` | Login | `{ username, password }` |

---

## 12. Security Considerations

### Security Checklist
- [ ] SESSION_SECRET is 32+ random characters
- [ ] Cookies: httpOnly, secure, sameSite=strict
- [ ] API routes protected with requireAuth
- [ ] Input validation on all forms (zod recommended)
- [ ] SQL injection protected (Prisma ORM)
- [ ] XSS protected (React auto-escape)
- [ ] Rate limiting on login (implement middleware)

### Next.js Security Headers
```javascript
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
}
```

---

## 13. Troubleshooting

| Issue | Fix |
|-------|-----|
| "Session Secret Missing" | Add SESSION_SECRET to Vercel environment variables |
| "Database connection failed" | Check Turso token validity, regenerate: `turso db tokens create kreasilog-prod` |
| "Prisma Client not found" | Ensure postinstall script: `"postinstall": "prisma generate"` |
| "Build failed - Type errors" | Run locally: `npx tsc --noEmit` |

### Database Backup
```bash
# Turso dump
turso db shell kreasilog-prod ".dump" > backup-$(date +%Y%m%d).sql
```

---

## 14. Documentation Files

| File | Description |
|------|-------------|
| `build.md` | Build & Deployment Guide (416 lines) |
| `pmd.md` | Project Management Document - Architecture, Schema, API (378 lines) |
| `ui.md` | UI/UX Design System - Components, Colors, Layouts (557 lines) |

---

## 15. Success Criteria

- [ ] User dapat update progress department masing-masing secara bersamaan tanpa blocking
- [ ] Auto-log tergenerate setiap perubahan dengan detail lengkap (who, when, change)
- [ ] Input progress menggunakan Smart Component (Quick Set + Slider + Fine adjust)
- [ ] Dual PO number tersimpan dan ditampilkan dengan benar
- [ ] Semua department punya visibility ke progress department lain (transparency)
- [ ] Deployed ke Vercel dengan zero critical bugs

---

*Document Version: 1.0*  
*Status: Ready for Development*
