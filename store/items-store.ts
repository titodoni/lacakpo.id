import { create } from 'zustand';

export interface ItemTrack {
  id: string;
  department: string;
  progress: number;
  updated_by: string | null;
  updated_at: string | null;
  last_note: string | null;
  updatedByUser?: { name: string } | null;
}

export interface ItemIssue {
  id: string;
  title: string;
  priority: string;
  status: 'open' | 'resolved';
  creator?: {
    id: string;
    name: string;
    role?: string;
  } | null;
  resolver?: {
    id: string;
    name: string;
    role?: string;
  } | null;
  resolvedAt?: string | null;
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
    po_date: string | null;
    delivery_deadline: string | null;
    is_urgent: boolean;
    is_vendor_job: boolean;
    status: string;
    is_paid: boolean;
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
  updateTrack: (itemId: string, dept: string, trackData: Partial<ItemTrack>) => void;

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
