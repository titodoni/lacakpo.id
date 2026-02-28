'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useItemsStore } from '@/store/items-store';
import { useNotificationsStore } from '@/store/notifications-store';
import type { 
  POCreatedEvent, 
  TrackUpdatedEvent, 
  IssueEvent, 
  ItemDeliveredEvent,
  POStatusChangedEvent,
  POUrgentChangedEvent,
  FinanceEvent 
} from '@/types/pusher-events';

// Extend Window interface for Pusher from CDN
declare global {
  interface Window {
    Pusher: {
      logToConsole: boolean;
      new: (key: string, options: { cluster: string }) => {
        subscribe: (channel: string) => {
          bind: (event: string, callback: (data: unknown) => void) => void;
          unbind: (event: string, callback: (data: unknown) => void) => void;
          unbind_all: () => void;
        };
        unsubscribe: (channel: string) => void;
        disconnect: () => void;
        connection: {
          bind: (event: string, callback: (data: unknown) => void) => void;
          unbind_all: () => void;
        };
      };
    };
  }
}

const deptLabelFull: Record<string, string> = {
  drafting: 'Drafting',
  purchasing: 'Purchasing',
  production: 'Produksi',
  qc: 'QC',
  delivery: 'Delivery',
};

export function useRealtimeSync(currentUserId?: string) {
  const { addItems, removeItemsByPoId, updateTrack, updateItem, upsertIssue } = useItemsStore();
  const { addNotification } = useNotificationsStore();
  
  // Track processed events to prevent duplicates (React StrictMode can cause double-handling)
  const processedEvents = useRef<Set<string>>(new Set());
  
  const markEventProcessed = (eventId: string): boolean => {
    if (processedEvents.current.has(eventId)) {
      return false; // Already processed
    }
    processedEvents.current.add(eventId);
    
    // Cleanup old events after 5 seconds
    setTimeout(() => {
      processedEvents.current.delete(eventId);
    }, 5000);
    
    return true;
  };

  // ─── NEW PO CREATED ───────────────────────────────────────────
  const handlePOCreated = useCallback((rawData: unknown) => {
    try {
      const data = rawData as POCreatedEvent;
      
      // Deduplication: prevent double processing
      const eventId = `po-created-${data.poNumber}`;
      if (!markEventProcessed(eventId)) {
        return;
      }
      
      console.log('[Realtime] PO created:', data);
      
      // Inject new item cards at top of everyone's Tasks page
      addItems(data.items);
      
      // Add to notification center
      addNotification({
        type: 'system',
        title: `PO Baru: ${data.poNumber}`,
        message: `${data.clientName} · ${data.items.length} item · oleh ${data.actorName}`,
      }, eventId);
    } catch (err) {
      console.error('[Pusher] Handler error in po-created:', err);
    }
  }, [addItems, addNotification]);

  // ─── TRACK PROGRESS UPDATED ───────────────────────────────────
  const handleTrackUpdated = useCallback((rawData: unknown) => {
    try {
      const data = rawData as TrackUpdatedEvent;
      
      // Deduplication: create deterministic event ID (no timestamp!)
      const eventId = `track-${data.itemId}-${data.trackDepartment}-${data.newProgress}`;
      if (!markEventProcessed(eventId)) {
        console.log('[Realtime] Duplicate track event ignored:', eventId);
        return;
      }
      
      console.log('[Realtime] Track updated:', data);
      
      // Only that one progress bar moves
      updateTrack(data.itemId, data.trackDepartment, data.track);
      
      // Don't notify the person who made the update
      if (data.actorId === currentUserId) return;

      // Add to notification center (with deduplication key - no timestamp!)
      const notifKey = `track-${data.itemId}-${data.trackDepartment}-${data.newProgress}`;
      addNotification({
        type: 'progress',
        title: `${deptLabelFull[data.trackDepartment] || data.trackDepartment} diperbarui`,
        message: `${data.actorName} mengubah progress ke ${data.newProgress}%`,
        itemName: data.itemName,
        poNumber: data.poNumber,
      }, notifKey);
    } catch (err) {
      console.error('[Pusher] Handler error in track-updated:', err);
    }
  }, [currentUserId, updateTrack, addNotification]);

  // ─── ISSUE CREATED ────────────────────────────────────────────
  const handleIssueCreated = useCallback((rawData: unknown) => {
    try {
      const data = rawData as IssueEvent;
      
      // Deduplication: prevent double processing
      const eventId = `issue-created-${data.issue.id}`;
      if (!markEventProcessed(eventId)) {
        return;
      }
      
      console.log('[Realtime] Issue created:', data);
      
      // Issue badge appears on that item card
      upsertIssue(data.itemId, data.issue);

      // Add to notification center
      addNotification({
        type: 'issue',
        title: 'Masalah baru dilaporkan',
        message: `${data.issue.title} pada ${data.itemName}`,
        itemName: data.itemName,
        poNumber: data.poNumber,
      }, eventId);
    } catch (err) {
      console.error('[Pusher] Handler error in issue-created:', err);
    }
  }, [upsertIssue, addNotification]);

  // ─── ISSUE RESOLVED ───────────────────────────────────────────
  const handleIssueResolved = useCallback((rawData: unknown) => {
    try {
      const data = rawData as IssueEvent;
      
      // Deduplication: prevent double processing
      const eventId = `issue-resolved-${data.issue.id}`;
      if (!markEventProcessed(eventId)) {
        return;
      }
      
      console.log('[Realtime] Issue resolved:', data);
      
      // Issue badge updates on that item card with full data
      upsertIssue(data.itemId, { 
        ...data.issue, 
        status: 'resolved',
        resolver: data.issue.resolver,
        resolvedAt: data.issue.resolvedAt,
      });

      // Add to notification center
      addNotification({
        type: 'issue',
        title: `Issue selesai: ${data.issue.title}`,
        message: `${data.itemName} · oleh ${data.actorName}`,
        itemName: data.itemName,
        poNumber: data.poNumber,
      }, eventId);
    } catch (err) {
      console.error('[Pusher] Handler error in issue-resolved:', err);
    }
  }, [upsertIssue, addNotification]);

  // ─── ITEM DELIVERED ───────────────────────────────────────────
  const handleItemDelivered = useCallback((rawData: unknown) => {
    try {
      const data = rawData as ItemDeliveredEvent;
      
      // Deduplication: prevent double processing
      const eventId = `delivered-${data.itemId}-${data.quantityDelivered}`;
      if (!markEventProcessed(eventId)) {
        return;
      }
      
      console.log('[Realtime] Item delivered:', data);
      
      // Delivery status updates on that item card
      updateItem(data.itemId, {
        quantity_delivered: data.quantityDelivered,
        is_delivered: data.isDelivered,
      });

      // Add to notification center
      addNotification({
        type: 'delivery',
        title: 'Pengiriman dicatat',
        message: `${data.itemName} dikirim`,
        itemName: data.itemName,
        poNumber: data.poNumber,
      }, eventId);
    } catch (err) {
      console.error('[Pusher] Handler error in item-delivered:', err);
    }
  }, [updateItem, addNotification]);

  // ─── PO CANCELLED / ARCHIVED ─────────────────────────────────
  const handlePOStatusChanged = useCallback((rawData: unknown) => {
    try {
      const data = rawData as POStatusChangedEvent;
      
      // Deduplication: prevent double processing
      const eventId = `status-${data.poId}-${data.newStatus}`;
      if (!markEventProcessed(eventId)) {
        return;
      }
      
      console.log('[Realtime] PO status changed:', data);
      
      if (['cancelled', 'archived'].includes(data.newStatus)) {
        // Remove those item cards from Tasks page for everyone
        removeItemsByPoId(data.poId);

        // Add to notification center
        addNotification({
          type: 'system',
          title: `PO ${data.poNumber} ${data.newStatus}`,
          message: `oleh ${data.actorName}`,
          poNumber: data.poNumber,
        }, eventId);
      }
    } catch (err) {
      console.error('[Pusher] Handler error in po-status-changed:', err);
    }
  }, [removeItemsByPoId, addNotification]);

  // ─── PO URGENT TOGGLED ────────────────────────────────────────
  const handlePOUrgentChanged = useCallback((rawData: unknown) => {
    try {
      const data = rawData as POUrgentChangedEvent;
      
      // Deduplication: prevent double processing
      const eventId = `urgent-${data.poId}`;
      if (!markEventProcessed(eventId)) {
        return;
      }
      
      console.log('[Realtime] PO urgent changed:', data);
      
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
        // Add to notification center
        addNotification({
          type: 'system',
          title: `🔴 URGENT: ${data.poNumber}`,
          message: `oleh ${data.actorName}`,
          poNumber: data.poNumber,
        }, eventId);
      }
    } catch (err) {
      console.error('[Pusher] Handler error in po-urgent-changed:', err);
    }
  }, [updateItem, addNotification]);

  // ─── FINANCE UPDATED ──────────────────────────────────────────
  const handleFinanceUpdated = useCallback((rawData: unknown) => {
    try {
      const data = rawData as FinanceEvent;
      
      // Deduplication: prevent double processing
      const eventId = `finance-${data.poNumber}-${data.action}`;
      if (!markEventProcessed(eventId)) {
        return;
      }
      
      console.log('[Realtime] Finance updated:', data);
      
      // Find all items belonging to this PO and update their po.is_paid
      const { items } = useItemsStore.getState();
      Object.values(items)
        .filter(item => item.po.po_number === data.poNumber)
        .forEach(item => {
          updateItem(item.id, {
            po: { ...item.po, is_paid: data.isPaid }
          });
        });
      
      let title = '';
      let message = '';
      
      if (data.action === 'paid') {
        title = `Payment diterima: ${data.poNumber}`;
        message = `${data.actorName} menandai PO sebagai dibayar`;
      } else if (data.action === 'invoiced') {
        title = `Invoice dibuat: ${data.poNumber}`;
        message = `${data.actorName} membuat invoice ${data.invoiceNumber || 'N/A'}`;
      } else if (data.action === 'unpaid') {
        title = `Payment dibatalkan: ${data.poNumber}`;
        message = `${data.actorName} membatalkan pembayaran`;
      } else if (data.action === 'uninvoiced') {
        title = `Invoice dibatalkan: ${data.poNumber}`;
        message = `${data.actorName} membatalkan invoice`;
      }

      // Add to notification center
      addNotification({
        type: 'system',
        title,
        message,
        poNumber: data.poNumber,
      }, eventId);
    } catch (err) {
      console.error('[Pusher] Handler error in finance-updated:', err);
    }
  }, [updateItem, addNotification]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const Pusher = (window as unknown as { Pusher: typeof window.Pusher }).Pusher;
    if (!Pusher) {
      console.log('ℹ️ Real-time sync: Pusher SDK not loaded yet');
      return;
    }

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1';

    if (!pusherKey || pusherKey === 'your-pusher-key') {
      console.log('ℹ️ Real-time sync: Add your Pusher credentials to .env.local');
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      Pusher.logToConsole = true;
    }

    const pusher = new (Pusher as unknown as new (key: string, options: { cluster: string }) => {
      subscribe: (channel: string) => {
        bind: (event: string, callback: (data: unknown) => void) => void;
        unbind: (event: string, callback: (data: unknown) => void) => void;
        unbind_all: () => void;
      };
      unsubscribe: (channel: string) => void;
      disconnect: () => void;
      connection: {
        bind: (event: string, callback: (data: unknown) => void) => void;
        unbind_all: () => void;
      };
    })(pusherKey, {
      cluster: pusherCluster,
    });

    // Connection state handlers
    pusher.connection.bind('connected', () => {
      console.log('[Pusher] Connected');
    });

    pusher.connection.bind('disconnected', () => {
      console.log('[Pusher] Disconnected');
    });

    pusher.connection.bind('failed', () => {
      console.error('[Pusher] Connection failed');
    });

    pusher.connection.bind('error', (err: unknown) => {
      console.error('[Pusher] Connection error:', err);
    });

    const channel = pusher.subscribe('po-channel');

    // Subscription error handler
    channel.bind('pusher:subscription_error', (err: unknown) => {
      console.error('[Pusher] Subscription error:', err);
    });

    // Bind all event handlers
    channel.bind('po-created', handlePOCreated as (data: unknown) => void);
    channel.bind('track-updated', handleTrackUpdated as (data: unknown) => void);
    channel.bind('issue-created', handleIssueCreated as (data: unknown) => void);
    channel.bind('issue-resolved', handleIssueResolved as (data: unknown) => void);
    channel.bind('item-delivered', handleItemDelivered as (data: unknown) => void);
    channel.bind('po-status-changed', handlePOStatusChanged as (data: unknown) => void);
    channel.bind('po-urgent-changed', handlePOUrgentChanged as (data: unknown) => void);
    channel.bind('finance-updated', handleFinanceUpdated as (data: unknown) => void);

    console.log('✅ Real-time sync connected to channel: po-channel');

    return () => {
      pusher.connection.unbind_all();
      channel.unbind_all();
      pusher.unsubscribe('po-channel');
      pusher.disconnect();
    };
  }, [handlePOCreated, handleTrackUpdated, handleIssueCreated, handleIssueResolved, handleItemDelivered, handlePOStatusChanged, handlePOUrgentChanged, handleFinanceUpdated]);
}
