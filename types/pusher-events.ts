export type PusherEvent =
  | POCreatedEvent
  | TrackUpdatedEvent
  | IssueEvent
  | ItemDeliveredEvent
  | POStatusChangedEvent
  | POUrgentChangedEvent
  | FinanceEvent;

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
      po_date: string | null;
      delivery_deadline: string | null;
      is_urgent: boolean;
      is_vendor_job: boolean;
      status: string;
      is_paid: boolean;
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
    updated_by: string | null;
    updated_at: string | null;
    last_note: string | null;
    updatedByUser: { name: string } | null;
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

export interface FinanceEvent {
  type: 'finance-updated';
  actorName: string;
  poNumber: string;
  action: 'invoiced' | 'uninvoiced' | 'paid' | 'unpaid' | 'updated';
  invoiceNumber?: string;
  isPaid: boolean;
  isInvoiced: boolean;
}
