# LacakPO.id - Future Updates & Bug Tracking

> Last Updated: 2026-02-28  
> Status: Active Development Tracker

---

## 🐛 KNOWN BUGS (To Fix)

### High Priority
| ID | Bug Description | Affected Area | Status |
|----|-----------------|---------------|--------|
| BUG-001 | Finance page fetches items per PO causing N+1 query | `app/finance/page.tsx` | 🔴 Open |
| BUG-002 | PO detail page does not refresh after track update | `app/pos/[id]/page.tsx` | 🔴 Open |
| BUG-003 | Real-time sync occasionally shows duplicate toasts | `hooks/use-realtime-sync.ts` | 🟡 Low |

### Medium Priority
| ID | Bug Description | Affected Area | Status |
|----|-----------------|---------------|--------|
| BUG-004 | Mobile view: Month selector overflows on small screens | `app/tasks/page.tsx` | 🟡 Open |
| BUG-005 | Search results don't highlight matching text | `app/search/page.tsx` | 🟡 Open |
| BUG-006 | Activity logs pagination missing (loads all 100+) | `app/logs/page.tsx` | 🟡 Open |

### Low Priority
| ID | Bug Description | Affected Area | Status |
|----|-----------------|---------------|--------|
| BUG-007 | Theme flash on initial page load (FOUC) | `app/layout.tsx` | 🟢 Low |
| BUG-008 | Print stylesheet not optimized for PO detail | `app/pos/[id]/page.tsx` | 🟢 Low |

---

## ✨ PLANNED FEATURES

### Phase 1: Core Enhancements (Next 2 Weeks)

#### FEAT-001: Push Notifications
- **Description**: Browser push notifications for important events
- **Trigger Events**:
  - PO marked as URGENT
  - New issue reported on your department
  - PO cancelled by admin
  - Item ready for delivery (QC 100%)
- **Tech**: Pusher Beams (already integrated)
- **Files**: `components/push-notifications.tsx`, `hooks/use-push-notifications.ts`
- **Status**: 🔴 Not Started

#### FEAT-002: Export Reports to Excel/PDF
- **Description**: Download reports as Excel or PDF
- **Formats**: 
  - Excel: .xlsx for data analysis
  - PDF: Formatted report for printing
- **Reports to Export**:
  - Delayed items list
  - Problems/issues list
  - Finished POs
  - Ongoing items
- **Libraries**: `xlsx` for Excel, `jspdf` for PDF
- **Status**: 🔴 Not Started

#### FEAT-003: Bulk Operations
- **Description**: Select multiple items for bulk actions
- **Actions**:
  - Bulk mark as delivered
  - Bulk update status
  - Bulk delete (admin only)
- **UI**: Checkbox selection on item cards
- **Status**: 🔴 Not Started

---

### Phase 2: Advanced Features (Next Month)

#### FEAT-004: Email Notifications
- **Description**: Email alerts for users
- **Triggers**:
  - Daily digest of updates
  - Weekly summary report
  - Immediate alerts for urgent POs
- **Integration**: SendGrid or Resend
- **Status**: 🔴 Not Started

#### FEAT-005: File Attachments
- **Description**: Upload files to POs and items
- **Use Cases**:
  - Attach drawings/specs to items
  - Upload invoice PDFs
  - Attach delivery photos
- **Storage**: Vercel Blob or AWS S3
- **Limits**: 10MB per file, max 5 files per item
- **Status**: 🔴 Not Started

#### FEAT-006: Advanced Search & Filters
- **Description**: Enhanced search with filters
- **Filters**:
  - Date range (created, deadline, delivered)
  - Progress range (e.g., 50-80%)
  - Multiple departments
  - Client multi-select
- **Search**: Full-text search on item names, specs
- **Status**: 🔴 Not Started

#### FEAT-007: Dashboard Widgets Customization
- **Description**: Users can customize dashboard layout
- **Widgets**:
  - My Tasks
  - Urgent Items
  - Department Progress
  - Recent Activity
- **Layout**: Drag-and-drop grid
- **Status**: 🔴 Not Started

---

### Phase 3: Enterprise Features (Future)

#### FEAT-008: Multi-Company Support
- **Description**: Single deployment, multiple companies
- **Features**:
  - Company isolation
  - Admin per company
  - Separate data namespaces
- **Use Case**: SaaS offering for multiple manufacturing clients
- **Status**: 🔴 Not Started

#### FEAT-009: API for External Integrations
- **Description**: REST API for third-party integrations
- **Use Cases**:
  - ERP integration (SAP, Oracle)
  - Accounting software sync
  - WhatsApp bot integration
- **Auth**: API Keys
- **Status**: 🔴 Not Started

#### FEAT-010: Advanced Analytics
- **Description**: Charts and analytics dashboard
- **Metrics**:
  - Department efficiency over time
  - Average completion time per item
  - Bottleneck identification
  - Predictive delivery estimates
- **Charts**: Recharts or Chart.js
- **Status**: 🔴 Not Started

---

## 🔧 TECHNICAL DEBT

### Performance Improvements
| ID | Task | Current Issue | Target | Priority |
|----|------|---------------|--------|----------|
| PERF-001 | Optimize dashboard query | 3 parallel queries, can be cached | Single query with cache | High |
| PERF-002 | Add React Query caching | Manual fetch in useEffect | useQuery with staleTime | High |
| PERF-003 | Image optimization | No next/image usage | Implement next/image | Medium |
| PERF-004 | Bundle analysis | Unknown bundle size | Add bundle analyzer | Low |

### Code Quality
| ID | Task | Description | Priority |
|----|------|-------------|----------|
| DEBT-001 | TypeScript strict mode | Enable strict in tsconfig.json | Medium |
| DEBT-002 | E2E Testing | Add Playwright tests for critical paths | High |
| DEBT-003 | Unit Tests | Add Jest tests for utilities | Medium |
| DEBT-004 | Storybook | Document UI components | Low |

---

## 🎨 UI/UX IMPROVEMENTS

### Mobile Experience
| ID | Improvement | Description | Priority |
|----|-------------|-------------|----------|
| UI-001 | Bottom Navigation | Add mobile bottom nav for quick access | High |
| UI-002 | Pull to Refresh | Swipe down to refresh on mobile | Medium |
| UI-003 | Swipe Actions | Swipe cards for quick actions | Low |

### Desktop Experience
| ID | Improvement | Description | Priority |
|----|-------------|-------------|----------|
| UI-004 | Keyboard Shortcuts | Ctrl+K for search, arrow keys for navigation | Medium |
| UI-005 | Collapsible Sidebar | Mini sidebar on hover | Low |
| UI-006 | Dark Mode | System-based dark theme | Low |

---

## 📝 CHANGE LOG (Recent)

### 2026-02-28
- ✅ Added skeleton loading screens for all pages
- ✅ Fixed transaction wrapper for track updates
- ✅ Updated PMD.md to v2.0 with LacakPO.id branding
- ✅ Deleted outdated documentation files

### 2026-02-27
- ✅ Implemented real-time sync with Pusher
- ✅ Added multi-theme system (4 palettes)
- ✅ Added finance module (invoice & payment)
- ✅ Added reports dashboard

### 2026-02-26
- ✅ Added vendor job support
- ✅ Added issue tracking system
- ✅ Added delivery management
- ✅ Optimized mobile responsive design

---

## 🎯 PRIORITY QUEUE

### This Week
1. Fix BUG-001: Finance page N+1 query
2. Fix BUG-002: PO detail refresh after update
3. Start FEAT-001: Push notifications

### Next Week
4. Implement FEAT-002: Export reports
5. Start FEAT-003: Bulk operations
6. Fix BUG-004: Mobile month selector overflow

### Next Month
7. Implement FEAT-005: File attachments
8. Start FEAT-006: Advanced search
9. Add DEBT-002: E2E tests

---

## 💡 IDEAS BACKLOG

- [ ] WhatsApp integration for notifications
- [ ] Barcode/QR code for items
- [ ] Time tracking per department
- [ ] Cost tracking per PO
- [ ] Supplier management module
- [ ] Inventory integration
- [ ] Customer portal (view-only for clients)
- [ ] Mobile app (React Native/Expo)
- [ ] Voice commands for updates
- [ ] AI-powered delivery predictions

---

## 📊 METRICS TO TRACK

- [ ] Average page load time
- [ ] Real-time event latency
- [ ] User engagement (daily active users)
- [ ] Feature usage statistics
- [ ] Error rates (Sentry integration)
- [ ] Database query performance

---

**How to use this file:**
1. When starting work, move item from "To Do" to "In Progress"
2. When complete, move to "Done" and add to Change Log
3. Add new bugs/features as they are discovered/requested
4. Review and update priorities weekly
