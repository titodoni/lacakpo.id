BUGS found:

FIXED ✅ -Report page is not available 
- Fix: ThemeProvider now provides context during SSR/hydration to prevent "useTheme must be used within a ThemeProvider" error
- File modified: lib/themes/ThemeProvider.tsx

FIXED ✅ -In mobile view, items cards detail is not informatif, text to big to fit. we need to refine it. the status progress is not inline full, we need to adjust it.
- Fix: ItemCard now has responsive design with smaller text on mobile (using sm: breakpoints)
- Progress bars are now full width
- Text sizes adjusted: text-xs/sm for mobile, sm:text-base for desktop
- File modified: components/ItemCard.tsx

FIXED ✅ - if an item have a problem report, it must show in the cards item detail, so everyone knows, and it clickable to show the problems, pop up.
- Fix: Added clickable issue badge in ItemCard header that opens a popup showing all issues
- New IssuesPopup component inside ItemCard
- Shows open and resolved issues with expandable details
- Added "Laporkan Masalah Baru" button in popup
- File modified: components/ItemCard.tsx

FIXED ✅ - the app is so slow, the saving not instance, loading slow, fix it.
- Fix: Multiple performance improvements:
  1. ItemCard: Optimistic updates - UI updates immediately before API call
  2. ItemCard: Added debounced updates for slider (300ms) to reduce API calls
  3. ItemCard: AbortController to cancel pending requests
  4. Tasks page: Eliminated N+1 query by including issues in initial fetch
  5. Tasks page: Added refreshItems() for updates without full loading state
  6. PO Detail page: Added refreshPO() for updates without full loading state
  7. API: Added caching headers and no-store for dynamic data
- Files modified: 
  - components/ItemCard.tsx
  - app/tasks/page.tsx
  - app/pos/[id]/page.tsx
  - app/api/items/route.ts

FIXED ✅ - Issues page tabs too many - consolidated to essential tabs only
- Fix: Combined status and priority filters into single row with 4 essential tabs:
  1. Semua (All)
  2. Terbuka (Open)
  3. Prioritas Tinggi (High Priority)
  4. Selesai (Resolved)
- Removed separate status and priority filter rows
- File modified: app/issues/page.tsx

FIXED ✅ - Card item progress text too long - made compact
- Fix: Shortened department labels:
  - Drafting → Draft
  - Purchasing → Purch
  - Production → Prod
  - Delivery → Deliv
  - QC (unchanged)
- File modified: components/ItemCard.tsx

FIXED ✅ - Build error: PrismaClient failed to initialize in Edge Runtime
- Fix: Removed `runtime = 'edge'` from `/api/reports/dashboard/route.ts`
- Prisma Client requires Node.js runtime, not Edge Runtime
- File modified: app/api/reports/dashboard/route.ts

FIXED ✅ - Color palette/theme switching not working
- Fix: Removed hardcoded CSS values in globals.css that were overriding theme variables
- Theme now properly switches when selecting different palettes
- CSS variables from globals-themes.css now work correctly
- Files modified:
  - app/globals.css

FIXED ✅ - Theme selector should only be on login page
- Fix: Moved theme selector from DashboardLayout to Login page only
- Added visual theme selector with color preview buttons on login page
- Theme is saved to localStorage and persists across sessions
- Removed PaletteSwitcherCompact from DashboardLayout (desktop & mobile)
- Files modified:
  - app/login/page.tsx
  - components/DashboardLayout.tsx

FIXED ✅ - "Proyek PENTING" changed to "URGENT"
- Fix: Updated text label in Create PO page
- File modified: app/pos/new/page.tsx

FIXED ✅ - "Items" changed to "Nama Barang"
- Fix: Updated section title in Create PO page
- Item labels changed from "Item ke-X" to "Barang ke-X"
- File modified: app/pos/new/page.tsx

FIXED ✅ - All English text in Create PO changed to Indonesian
- Changes:
  - Client PO Number → No. PO Client
  - Delivery Deadline → Batas Pengiriman
  - Production Type → Jenis Produksi
  - Machining/Fabrication/Both → Machining/Fabrikasi/Keduanya
  - Client Reference → Referensi Client
- File modified: app/pos/new/page.tsx

FIXED ✅ - Create PO page mobile friendly and theme palette
- Fix: Complete rewrite with:
  - Responsive design (sm: breakpoints)
  - Uses theme CSS variables (bg-card, border-border, text-foreground, etc.)
  - Compact form layout for mobile
  - Proper spacing and sizing for touch targets
  - Integrated with DashboardLayout
- File modified: app/pos/new/page.tsx

FIXED ✅ - Login flow: Department → User, Password → PIN 5 digits
- Fix: Updated login flow:
  1. Select Department first (dropdown with unique departments)
  2. Then select User (filtered by department)
  3. Enter PIN (5 digits, numeric input only)
  - PIN input shows dots (•••••) with centered monospaced font
  - Added input validation (only numbers, max 5 digits)
  - Default PIN changed from "demo" to "12345"
- Files modified: app/login/page.tsx

FIXED ✅ - ItemCard not following theme palette - now uses theme colors
- Fix: Replaced all hardcoded colors with theme CSS variables:
  - Header background: bg-accent/10 (uses theme accent)
  - Text: text-foreground, text-primary, text-accent
  - Progress bars: bg-primary, bg-muted
  - Status badges: bg-red-100, bg-orange-100, bg-blue-100, bg-amber-100, bg-emerald-100
  - Issue badge: bg-destructive (theme destructive color)
  - Vendor badge: bg-blue-100 (consistent)
  - All borders use border-border or border-accent/30
- Removed hardcoded color palette object
- File modified: components/ItemCard.tsx

FIXED ✅ - Manager can edit/delete PO - removed permission
- Fix: Changed isAdmin check from:
    `user.role === 'super_admin' || user.role === 'manager'`
  To:
    `user.role === 'super_admin'`
- Only super_admin can now edit/delete PO, manager is view-only
- File modified: app/pos/[id]/page.tsx

FIXED ✅ - Remove "Aktivitas Terbaru", replace with PO List on dashboard
- Fix: Replaced Recent Activity section with PO List on homepage (for manager, admin, sales)
- Shows up to 10 recent POs with:
  - PO Number and Client PO Number
  - Client name
  - Item count
  - PO Date
  - Days remaining or overdue status
  - Status badge (Aktif/Selesai/Batal)
  - URGENT and VENDOR badges
- Added "Buat PO" button for authorized users
- File modified: app/page.tsx
