# 🔄 Complete Real-Time Sync Map — lacakPO.id
## Every event → exact behavior on every user's screen

---

## EVENT MAP

| Event | Triggered By | Tasks Page Behavior | Toast |
|---|---|---|---|
| New PO created | Admin | New item cards APPEAR instantly | ✅ "PO Baru: PO-2026-015" |
| Track progress updated | Any operator | That item's progress bar updates in place | ✅ "Andi · Bracket SKF · Prod 50→80%" |
| Issue reported | Anyone | Issue badge appears on that item card | ✅ "⚠️ Issue baru · Bracket SKF" |
| Issue resolved | Anyone | Issue badge updates on that item card | ✅ "✅ Issue selesai · Bracket SKF" |
| Item delivered | Delivery | Item card shows delivered state | ✅ "Terkirim · Bracket SKF" |
| PO cancelled/archived | Admin | Those item cards DISAPPEAR from Tasks | ✅ "PO-2026-015 dibatalkan" |
| PO urgent flag toggled | Admin | Item card shows/hides URGENT badge | ✅ "URGENT · PO-2026-015" |

---

## THE FULL IMPLEMENTATION

---

### STEP 1 — Zustand Store (handles all event types)

```typescript
// store/items-store.ts
import { create } from 'zustand';

export interface ItemTrack {
  id: string;
  department: string;
  progress: number;
  updated_by: string | null;
  updated_at: string | null;
  last_note: string | null;
  updatedByUser?: { name: string };
}

export interface ItemIssue {
  id: string;
  title: string;
  priority: string;
  status: 'open' | 'resolved';
}

export interface Item {
  id: string;
  po_id: string;
  item_name: string;
  specification: string | null;
  quantity_total: number;
  quantity_unit: string;
  quantity_delivered: number;
  is_delivered: boolean;
  delivered_at: string | null;
  tracks: ItemTrack[];
  issues: ItemIssue[];
  po: {
    id: string;
    po_number: string;
    delivery_deadline: string | null;
    is_urgent: boolean;
    is_vendor_job: boolean;
    status: string;
    client: { name: string };
  };
}

interface ItemsStore {
  items: Record<string, Item>;           // keyed by item.id
  orderedIds: string[];                  // preserves display order

  // Bulk load on page mount
  setItems: (items: Item[]) => void;

  // New PO → inject ALL its items at top of list
  addItems: (items: Item[]) => void;

  // Remove items when PO is cancelled/archived
  removeItemsByPoId: (poId: string) => void;

  // Update one track inside one item
  updateTrack: (itemId: string, dept: string, track: Partial<ItemTrack>) => void;

  // Update item-level fields (delivered, urgent, etc.)
  updateItem: (itemId: string, data: Partial<Item>) => void;

  // Add or update an issue on an item
  upsertIssue: (itemId: string, issue: ItemIssue) => void;
}

export const useItemsStore = create<ItemsStore>((set) => ({
  items: {},
  orderedIds: [],

  setItems: (items) => set({
    items: Object.fromEntries(items.map(i => [i.id, i])),
    orderedIds: items.map(i => i.id),
  }),

  // Prepend new items to top of list (newest PO first)
  addItems: (newItems) => set((state) => {
    const newEntries = Object.fromEntries(newItems.map(i => [i.id, i]));
    const newIds = newItems.map(i => i.id);
    return {
      items: { ...newEntries, ...state.items },
      orderedIds: [...newIds, ...state.orderedIds],
    };
  }),

  removeItemsByPoId: (poId) => set((state) => {
    const removedIds = new Set(
      Object.values(state.items)
        .filter(i => i.po_id === poId)
        .map(i => i.id)
    );
    const newItems = Object.fromEntries(
      Object.entries(state.items).filter(([id]) => !removedIds.has(id))
    );
    return {
      items: newItems,
      orderedIds: state.orderedIds.filter(id => !removedIds.has(id)),
    };
  }),

  updateTrack: (itemId, dept, trackData) => set((state) => {
    const item = state.items[itemId];
    if (!item) return state;
    return {
      items: {
        ...state.items,
        [itemId]: {
          ...item,
          tracks: item.tracks.map(t =>
            t.department === dept ? { ...t, ...trackData } : t
          ),
        },
      },
    };
  }),

  updateItem: (itemId, data) => set((state) => {
    const item = state.items[itemId];
    if (!item) return state;
    return {
      items: {
        ...state.items,
        [itemId]: { ...item, ...data },
      },
    };
  }),

  upsertIssue: (itemId, issue) => set((state) => {
    const item = state.items[itemId];
    if (!item) return state;
    const exists = item.issues.find(i => i.id === issue.id);
    const updatedIssues = exists
      ? item.issues.map(i => i.id === issue.id ? issue : i)
      : [...item.issues, issue];
    return {
      items: {
        ...state.items,
        [itemId]: { ...item, issues: updatedIssues },
      },
    };
  }),
}));
```

---

### STEP 2 — Pusher Event Types

```typescript
// types/pusher-events.ts

export type PusherEvent =
  | POCreatedEvent
  | TrackUpdatedEvent
  | IssueEvent
  | ItemDeliveredEvent
  | POStatusChangedEvent
  | POUrgentChangedEvent;

export interface POCreatedEvent {
  type: 'po-created';
  poNumber: string;
  clientName: string;
  actorName: string;
  // Full item data so clients don't need extra API call
  items: Array<{
    id: string;
    po_id: string;
    item_name: string;
    specification: string | null;
    quantity_total: number;
    quantity_unit: string;
    quantity_delivered: number;
    is_delivered: boolean;
    delivered_at: string | null;
    tracks: any[];
    issues: any[];
    po: {
      id: string;
      po_number: string;
      delivery_deadline: string | null;
      is_urgent: boolean;
      is_vendor_job: boolean;
      status: string;
      client: { name: string };
    };
  }>;
}

export interface TrackUpdatedEvent {
  type: 'track-updated';
  itemId: string;
  trackDepartment: string;
  oldProgress: number;
  newProgress: number;
  actorId: string;       // to suppress toast for own update
  actorName: string;
  itemName: string;
  poNumber: string;
  track: {
    id: string;
    department: string;
    progress: number;
    updated_by: string;
    updated_at: string;
    last_note: string | null;
    updatedByUser: { name: string };
  };
}

export interface IssueEvent {
  type: 'issue-created' | 'issue-resolved';
  itemId: string;
  itemName: string;
  poNumber: string;
  actorName: string;
  issue: {
    id: string;
    title: string;
    priority: string;
    status: 'open' | 'resolved';
  };
}

export interface ItemDeliveredEvent {
  type: 'item-delivered';
  itemId: string;
  itemName: string;
  poNumber: string;
  actorName: string;
  quantityDelivered: number;
  isDelivered: boolean;
}

export interface POStatusChangedEvent {
  type: 'po-status-changed';
  poId: string;
  poNumber: string;
  newStatus: string; // 'cancelled' | 'archived' → triggers removal
  actorName: string;
}

export interface POUrgentChangedEvent {
  type: 'po-urgent-changed';
  poId: string;
  poNumber: string;
  isUrgent: boolean;
  actorName: string;
}
```

---

### STEP 3 — The Hook (handles every event type)

```typescript
// hooks/use-realtime-sync.ts
'use client';

import { useEffect } from 'react';
import Pusher from 'pusher-js';
import { toast } from 'sonner';
import { useItemsStore } from '@/store/items-store';
import type { PusherEvent } from '@/types/pusher-events';

export function useRealtimeSync(currentUserId: string) {
  const {
    addItems,
    removeItemsByPoId,
    updateTrack,
    updateItem,
    upsertIssue,
  } = useItemsStore();

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('po-channel');

    // ─── NEW PO CREATED ───────────────────────────────────────────
    // Inject new item cards at top of everyone's Tasks page
    channel.bind('po-created', (data: POCreatedEvent) => {
      addItems(data.items); // cards appear instantly for all users

      toast.success(`PO Baru: ${data.poNumber}`, {
        description: `${data.clientName} · ${data.items.length} item · oleh ${data.actorName}`,
        duration: 5000,
      });
    });

    // ─── TRACK PROGRESS UPDATED ───────────────────────────────────
    // Only that one progress bar moves
    channel.bind('track-updated', (data: TrackUpdatedEvent) => {
      updateTrack(data.itemId, data.trackDepartment, data.track);

      // Don't show toast to the person who made the update
      if (data.actorId === currentUserId) return;

      const deptLabel: Record<string, string> = {
        drafting: 'Draft', purchasing: 'Purch',
        production: 'Prod', qc: 'QC', delivery: 'Delivery',
      };

      toast.info(`${data.actorName} · ${data.itemName}`, {
        description: `${deptLabel[data.trackDepartment]}: ${data.oldProgress}% → ${data.newProgress}%`,
        duration: 3000,
      });
    });

    // ─── ISSUE CREATED ────────────────────────────────────────────
    // Issue badge appears on that item card
    channel.bind('issue-created', (data: IssueEvent) => {
      upsertIssue(data.itemId, data.issue);

      toast.warning(`⚠️ Issue Baru: ${data.issue.title}`, {
        description: `${data.itemName} · ${data.poNumber} · oleh ${data.actorName}`,
        duration: 5000,
      });
    });

    // ─── ISSUE RESOLVED ───────────────────────────────────────────
    // Issue badge updates on that item card
    channel.bind('issue-resolved', (data: IssueEvent) => {
      upsertIssue(data.itemId, { ...data.issue, status: 'resolved' });

      toast.success(`✅ Issue Selesai: ${data.issue.title}`, {
        description: `${data.itemName} · oleh ${data.actorName}`,
        duration: 3000,
      });
    });

    // ─── ITEM DELIVERED ───────────────────────────────────────────
    // Delivery status updates on that item card
    channel.bind('item-delivered', (data: ItemDeliveredEvent) => {
      updateItem(data.itemId, {
        quantity_delivered: data.quantityDelivered,
        is_delivered: data.isDelivered,
      });

      toast.success(`📦 Terkirim: ${data.itemName}`, {
        description: `${data.poNumber} · oleh ${data.actorName}`,
        duration: 4000,
      });
    });

    // ─── PO CANCELLED / ARCHIVED ─────────────────────────────────
    // Remove those item cards from Tasks page for everyone
    channel.bind('po-status-changed', (data: POStatusChangedEvent) => {
      if (['cancelled', 'archived'].includes(data.newStatus)) {
        removeItemsByPoId(data.poId); // cards vanish instantly

        toast.info(`PO ${data.poNumber} ${data.newStatus}`, {
          description: `oleh ${data.actorName}`,
          duration: 4000,
        });
      }
    });

    // ─── PO URGENT TOGGLED ────────────────────────────────────────
    // URGENT badge appears/disappears on all items of that PO
    channel.bind('po-urgent-changed', (data: POUrgentChangedEvent) => {
      // Find all items belonging to this PO and update their po.is_urgent
      const { items } = useItemsStore.getState();
      Object.values(items)
        .filter(item => item.po_id === data.poId)
        .forEach(item => {
          updateItem(item.id, {
            po: { ...item.po, is_urgent: data.isUrgent }
          });
        });

      if (data.isUrgent) {
        toast.warning(`🔴 URGENT: ${data.poNumber}`, {
          description: `oleh ${data.actorName}`,
          duration: 5000,
        });
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('po-channel');
      pusher.disconnect();
    };
  }, [currentUserId, addItems, removeItemsByPoId, updateTrack, updateItem, upsertIssue]);
}
```

---

### STEP 4 — Server Triggers (one per API route)

```typescript
// ─── After creating PO ────────────────────────────────────────────
// app/api/pos/route.ts
const newPO = await prisma.purchaseOrder.create({ ... });
const itemsWithFull = await prisma.item.findMany({
  where: { po_id: newPO.id },
  include: {
    tracks: { include: { updatedByUser: { select: { name: true } } } },
    issues: true,
    po: { include: { client: { select: { name: true } } } },
  }
});
await pusherServer.trigger('po-channel', 'po-created', {
  type: 'po-created',
  poNumber: newPO.po_number,
  clientName: client.name,
  actorName: session.user.name,
  items: itemsWithFull, // Full data — no extra API call needed on client
});

// ─── After updating track ─────────────────────────────────────────
// app/api/tracks/[trackId]/update/route.ts
await pusherServer.trigger('po-channel', 'track-updated', {
  type: 'track-updated',
  itemId: track.item_id,
  trackDepartment: track.department,
  oldProgress: track.progress,
  newProgress: body.newProgress,
  actorId: session.user.id,
  actorName: session.user.name,
  itemName: item.item_name,
  poNumber: item.po.po_number,
  track: updatedTrack, // full updated track object
});

// ─── After creating issue ─────────────────────────────────────────
// app/api/issues/route.ts
await pusherServer.trigger('po-channel', 'issue-created', {
  type: 'issue-created',
  itemId: newIssue.item_id,
  itemName: item.item_name,
  poNumber: item.po.po_number,
  actorName: session.user.name,
  issue: { id: newIssue.id, title: newIssue.title, priority: newIssue.priority, status: 'open' },
});

// ─── After delivery ───────────────────────────────────────────────
// app/api/deliveries/route.ts
await pusherServer.trigger('po-channel', 'item-delivered', {
  type: 'item-delivered',
  itemId: item.id,
  itemName: item.item_name,
  poNumber: item.po.po_number,
  actorName: session.user.name,
  quantityDelivered: updatedItem.quantity_delivered,
  isDelivered: updatedItem.is_delivered,
});

// ─── After PO status change ───────────────────────────────────────
// app/api/pos/[id]/route.ts (PATCH/DELETE)
await pusherServer.trigger('po-channel', 'po-status-changed', {
  type: 'po-status-changed',
  poId: po.id,
  poNumber: po.po_number,
  newStatus: body.status,
  actorName: session.user.name,
});
```

---

### STEP 5 — Tasks Page (the complete picture)

```typescript
// app/tasks/page.tsx
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TasksClient } from './tasks-client';

// Server component — fetches initial data
export default async function TasksPage() {
  const session = await getSession();

  const initialItems = await prisma.item.findMany({
    where: {
      po: { status: 'active' },
      is_delivered: false,
    },
    include: {
      tracks: { include: { updatedByUser: { select: { name: true } } } },
      issues: { where: { status: 'open' } },
      po: {
        include: { client: { select: { name: true } } }
      },
    },
    orderBy: { po: { delivery_deadline: 'asc' } },
  });

  return (
    <TasksClient
      initialItems={initialItems}
      currentUserId={session.user.id}
    />
  );
}
```

```typescript
// app/tasks/tasks-client.tsx
'use client';

import { useEffect } from 'react';
import { useItemsStore } from '@/store/items-store';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';
import { ItemCard } from '@/components/ItemCard';
import type { Item } from '@/store/items-store';

interface Props {
  initialItems: Item[];
  currentUserId: string;
}

export function TasksClient({ initialItems, currentUserId }: Props) {
  const { setItems, orderedIds } = useItemsStore();

  // Load initial server data into store ONCE
  useEffect(() => {
    setItems(initialItems);
  }, []); // empty deps — only on mount

  // Start Pusher listener — all events handled surgically
  useRealtimeSync(currentUserId);

  return (
    <div className="space-y-3 p-4">
      {orderedIds.map(itemId => (
        <ItemCard key={itemId} itemId={itemId} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
```

---

### STEP 6 — ItemCard reads from store by ID

```typescript
// components/ItemCard.tsx
'use client';

import { useItemsStore } from '@/store/items-store';

interface Props {
  itemId: string;
  currentUserId: string;
}

export function ItemCard({ itemId, currentUserId }: Props) {
  // Selector — this card ONLY re-renders when ITS item changes in the store
  const item = useItemsStore(state => state.items[itemId]);

  if (!item) return null;

  return (
    <div className="...">
      {/* Item name, PO number, URGENT badge — from item.po */}
      {/* Progress bars — from item.tracks */}
      {/* Issue badge — from item.issues */}
      {/* Delivery status — from item.is_delivered */}
    </div>
  );
}
```

---

## EXACTLY WHAT HAPPENS IN YOUR 2-BROWSER TEST

```
Browser 1 — Admin creates PO-2026-015 (3 items)
────────────────────────────────────────────────────────
  Admin's Tasks page: 3 new ItemCards appear at top ✅
  Admin sees: toast "PO Baru: PO-2026-015" ✅

Browser 2 — Purchasing User on Tasks page
────────────────────────────────────────────────────────
  Purchasing's Tasks page: 3 new ItemCards appear at top ✅
  Purchasing sees: toast "PO Baru: PO-2026-015 · PT Sinar Abadi · 3 item" ✅
  Purchasing's existing cards: untouched, scroll position: unchanged ✅
  No refresh, no flicker, no reload ✅
```

---

## NO router.refresh() ANYWHERE

| Scenario | Old approach | New approach |
|---|---|---|
| New PO | router.refresh() → full reload | addItems() → new cards appear |
| Progress update | router.refresh() → full reload | updateTrack() → one bar moves |
| Issue reported | router.refresh() → full reload | upsertIssue() → badge appears |
| PO cancelled | router.refresh() → full reload | removeItemsByPoId() → cards vanish |
| Item delivered | router.refresh() → full reload | updateItem() → card updates |