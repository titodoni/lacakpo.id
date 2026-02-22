Project Management Document v1.0
System: Concurrent Multi-Department Progress Tracking
Deployment: Vercel | Auth: Username-Only | Design: Apple Minimalist
1. EXECUTIVE SUMMARY
Project tracking adalah sistem tracking manufaktur dengan pendekatan Concurrent Department Tracks. Setiap item dalam PO dapat dikerjakan oleh beberapa department (Drafting, Purchasing, Production, QC) secara bersamaan dengan progress independen.
Key Differentiators
No Workflow Lock: Semua department bisa update progress kapan saja, tidak ada urutan wajib
Independent Progress: Drafting 30%, Purchasing 80%, Production 50% — semua valid secara bersamaan
Auto-Audit Trail: Setiap perubahan terekam otomatis oleh sistem (siapa, kapan, dari berapa ke berapa)
Smart Input: Slider + Quick Set (0/25/50/75/100) + Fine adjustment (-5%/+5%)
Dual PO System: PO Internal (primary) + PO Client (optional reference)
2. SYSTEM ARCHITECTURE
2.1 Concurrent Track Model
plain
Copy
Item: Bearing SKF 6205
├── Track: Drafting     [████████░░] 80% (Budi)
├── Track: Purchasing   [██████████] 100% ✅ (Sari)
├── Track: Production   [█████░░░░░] 50% (Andi)
└── Track: QC           [░░░░░░░░░░] 0% (Waiting)

All tracks active simultaneously
No blocking between departments
2.2 Data Flow
plain
Copy
User Input (Slider/Quick Set)
    ↓
Update Track Progress (item_tracks table)
    ↓
Auto-Generate Activity Log (activity_logs table)
    ↓
Real-time Dashboard Update
3. DATABASE SCHEMA
3.1 Core Tables
sql
Copy
-- USERS (Username-only auth)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'super_admin', 'manager', 'sales_admin', 
    'drafter', 'purchasing', 
    'cnc_operator', 'milling_operator', 'fab_operator',
    'qc', 'delivery', 'finance'
  )),
  department TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CLIENTS
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g., "SA"
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PURCHASE ORDERS (Dual Number System)
CREATE TABLE purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL, -- Internal: PO-2026-001
  client_po_number TEXT, -- Original dari client (optional)
  client_id TEXT REFERENCES clients(id),
  po_date DATE NOT NULL,
  delivery_deadline DATE,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ITEMS
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  po_id TEXT REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  specification TEXT,
  quantity_total INTEGER NOT NULL,
  quantity_unit TEXT DEFAULT 'pcs',

  -- Delivery tracking
  quantity_delivered INTEGER DEFAULT 0,
  is_delivered BOOLEAN DEFAULT false,
  delivered_at DATETIME,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ITEM TRACKS (Concurrent Progress - CORE)
CREATE TABLE item_tracks (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
  department TEXT NOT NULL CHECK (department IN ('drafting', 'purchasing', 'production', 'qc')),

  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  updated_by TEXT REFERENCES users(id),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_note TEXT,

  UNIQUE(item_id, department)
);

-- ACTIVITY LOGS (Auto-Generated Audit)
CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
  track_id TEXT REFERENCES item_tracks(id),

  actor_id TEXT REFERENCES users(id),
  actor_name TEXT NOT NULL, -- Snapshot
  actor_role TEXT NOT NULL, -- Snapshot

  department TEXT NOT NULL, -- Target department
  action_type TEXT DEFAULT 'progress_update',

  old_progress INTEGER,
  new_progress INTEGER,
  delta INTEGER, -- Selisih (bisa negatif)

  system_message TEXT NOT NULL, -- Auto-generated
  user_note TEXT, -- Optional dari user

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DELIVERIES
CREATE TABLE deliveries (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES items(id),
  quantity INTEGER NOT NULL,
  delivery_date DATE NOT NULL,
  surat_jalan_number TEXT,
  notes TEXT,
  delivered_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_items_po ON items(po_id);
CREATE INDEX idx_tracks_item ON item_tracks(item_id);
CREATE INDEX idx_tracks_dept ON item_tracks(department);
CREATE INDEX idx_logs_item ON activity_logs(item_id);
CREATE INDEX idx_logs_created ON activity_logs(created_at DESC);
3.2 Auto-Log Generation Logic
TypeScript
Copy
// Trigger/Function saat progress update
function generateSystemMessage(
  actorName: string,
  department: string,
  oldProgress: number,
  newProgress: number
): string {
  const delta = newProgress - oldProgress;
  const direction = delta > 0 ? 'increased' : 'decreased';

  return `${actorName} ${direction} ${department} from ${oldProgress}% to ${newProgress}% (${delta > 0 ? '+' : ''}${delta}%)`;
}

// Contoh output:
// "Andi increased Production from 30% to 60% (+30%)"
// "Budi decreased Drafting from 80% to 70% (-10%)" -- Admin override
4. USER ROLES & PERMISSIONS
4.1 Role-Track Mapping
Table
Copy
Role	Can Update Tracks	Can View All	Special
Sales Admin	None (Input PO only)	✅ Yes	Create PO
Drafter	Drafting	✅ Yes	-
Purchasing	Purchasing	✅ Yes	-
CNC Operator	Production	✅ Yes	-
Milling Operator	Production	✅ Yes	-
Fab Operator	Production	✅ Yes	-
QC	QC	✅ Yes	Pass/Fail
Delivery	None	✅ Yes	Mark Delivered
Finance	None	Delivered only	Mark Closed
Manager	None (View only)	✅ Yes	Edit any
Super Admin	Any	✅ Yes	Full access
4.2 Concurrent Update Rule
Multiple operators (CNC, Milling, Fab) bisa update sama-sama Track Production
Last write wins dengan timestamp
Conflict resolution: Jika update bersamaan dalam 1 detik, gunakan timestamp + user notification
5. WORKFLOW SCENARIOS
Scenario 1: Normal Concurrent Work
plain
Copy
08:00 - PO Created (2 items)
08:15 - Drafter: Item 1 Drafting 0→40%
08:30 - Purchasing: Item 1 Purchasing 0→60%
09:00 - Operator: Item 1 Production 0→25%
09:15 - Drafter: Item 1 Drafting 40→80%
10:00 - QC: Item 1 QC 0→10% (pre-inspection)

Status: All departments active concurrently
Scenario 2: Production Priority (Skip ahead)
plain
Copy
09:00 - Manager request: Item urgent
09:05 - Operator: Production 0→50% (meski Drafting baru 60%)
09:30 - Drafter: Drafting 60→100% (catch up)

Valid: No blocking, just progress tracking
Scenario 3: Progress Correction
plain
Copy
14:00 - Operator: Production 80→100% (premature)
14:30 - QC Check: Fail, return to Production
14:35 - Admin: Production 100→70% (rollback)

Log: "Admin decreased Production from 100% to 70% (-30%) - QC Reject"
6. UI SPECIFICATIONS (Smart Input)
6.1 Progress Input Component
plain
Copy
┌─────────────────────────────────────┐
│ Update: Production                  │
│ Bearing SKF 6205                    │
├─────────────────────────────────────┤
│                                     │
│         ┌─────────┐                 │
│         │   60%   │                 │ ← Large Display (48px)
│         └─────────┘                 │
│                                     │
│ Quick Set:                          │
│ ┌────┬────┬────┬────┬────┐         │
│ │ 0% │25% │50% │75% │100%│         │ ← One-tap (min 44px)
│ └────┴────┴────┴────┴────┘         │
│                                     │
│ Fine Adjust:                        │
│ [ -5% ] ◀━━━━●━━━━▶ [ +5% ]        │
│                                     │
│ Note (Optional):                    │
│ ┌─────────────────────────────┐     │
│ │ Finishing toolpath...      │     │
│ └─────────────────────────────┘     │
│                                     │
│     [ Update Progress ]             │
│                                     │
└─────────────────────────────────────┘
6.2 Input Behavior
Quick Set Buttons: Instantly set value, haptic feedback
Fine Adjust: -5% or +5% untuk koreksi kecil
Visual Feedback: Warna berubah berdasarkan value
0-25%: Zinc-400
26-50%: Zinc-600
51-75%: Zinc-800
76-99%: Zinc-900
100%: Emerald-500 (Green)
Auto-Save Option: Toggle untuk auto-save saat slider release (optional)
7. API ENDPOINTS
7.1 Core Endpoints
TypeScript
Copy
// Progress Update
POST /api/tracks/[trackId]/update
Body: {
  newProgress: number (0-100),
  userNote?: string (optional)
}
Response: {
  success: true,
  logEntry: ActivityLog,
  updatedTrack: ItemTrack
}

// Get Item with All Tracks
GET /api/items/[itemId]
Response: {
  item: Item,
  tracks: ItemTrack[],
  recentLogs: ActivityLog[] (last 10)
}

// Get Activity Logs
GET /api/items/[itemId]/logs?department=&limit=50
Response: ActivityLog[]

// Create PO
POST /api/pos
Body: {
  poNumber: string,
  clientPoNumber?: string,
  clientId: string,
  items: [{
    name: string,
    spec: string,
    qty: number,
    unit: string
  }]
}
7.2 Permission Middleware
TypeScript
Copy
// Check user can update department track
function canUpdateTrack(user: User, trackDepartment: string) {
  const roleTrackMap = {
    'drafter': ['drafting'],
    'purchasing': ['purchasing'],
    'cnc_operator': ['production'],
    'milling_operator': ['production'],
    'fab_operator': ['production'],
    'qc': ['qc'],
    'super_admin': ['drafting', 'purchasing', 'production', 'qc']
  };

  return roleTrackMap[user.role]?.includes(trackDepartment);
}
8. DEVELOPMENT PHASES
Phase 1: Foundation (Day 1-2)
[ ] Next.js setup + Tailwind + shadcn/ui
[ ] Prisma schema (SQLite)
[ ] Database connection
[ ] Seed data (admin + sample users)
Phase 2: Auth & Layout (Day 3)
[ ] Username-only auth (Iron Session)
[ ] Apple minimalist layout
[ ] Role-based navigation
[ ] Mobile responsive shell
Phase 3: PO Management (Day 4-5)
[ ] Dual PO number input
[ ] Client management
[ ] Item creation with auto-init tracks
[ ] PO list view
Phase 4: Smart Input System (Day 6-7)
[ ] Progress input component (Slider + Quick Set + Fine adjust)
[ ] Auto-log generation
[ ] Track update API
[ ] Optimistic UI
Phase 5: Department Views (Day 8-9)
[ ] Department-specific dashboards
[ ] Concurrent track visualization
[ ] Activity timeline
[ ] Real-time feel (polling/refetch)
Phase 6: Delivery & Finance (Day 10)
[ ] Delivery marking
[ ] Finance view (delivered items only)
[ ] Invoice tracking
Phase 7: Polish & Deploy (Day 11-12)
[ ] PWA setup
[ ] Performance optimization
[ ] Vercel deployment
[ ] User testing
9. TECHNICAL REQUIREMENTS
Stack
Framework: Next.js 14 (App Router)
Database: SQLite (Turso/libSQL) atau Vercel Postgres
ORM: Prisma
Auth: Iron Session (stateless, username-only)
Styling: Tailwind CSS + shadcn/ui (Zinc theme)
State: Zustand + React Query
Icons: Lucide React
Performance Targets
First load: < 2s (4G)
API response: < 100ms
Build size: < 200KB (initial)
Security
CSRF protection (Iron Session)
XSS protection (React auto-escape)
SQL injection protection (Prisma)
Role-based access control (strict)
10. SUCCESS CRITERIA
[ ] User bisa update progress department masing-masing secara bersamaan tanpa blocking
[ ] Auto-log tergenerate setiap perubahan dengan detail lengkap (who, when, change)
[ ] Input progress menggunakan Smart Component (Quick Set + Slider + Fine adjust)
[ ] Dual PO number tersimpan dan ditampilkan dengan benar
[ ] Semua department punya visibility ke progress department lain (transparency)
[ ] Deployed ke Vercel dengan zero critical bugs
Document Version: 1.0
Last Updated: 2026-02-18
Status: Ready for Development