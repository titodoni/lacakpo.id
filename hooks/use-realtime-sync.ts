'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useItemsStore } from '@/store/items-store';
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
      };
    };
  }
}

// Toast deduplication - prevent duplicate notifications
const recentToasts = new Map<string, number>();
const TOAST_DEDUP_WINDOW = 3000; // 3 seconds

function getToastKey(title: string, description?: string): string {
  return `${title}|${description || ''}`;
}

function shouldShowToast(title: string, description?: string): boolean {
  const key = getToastKey(title, description);
  const now = Date.now();
  const lastShown = recentToasts.get(key);
  
  if (lastShown && now - lastShown < TOAST_DEDUP_WINDOW) {
    console.log('[Toast] Duplicate prevented:', key);
    return false;
  }
  
  recentToasts.set(key, now);
  
  // Cleanup old entries
  for (const [k, t] of recentToasts.entries()) {
    if (now - t > TOAST_DEDUP_WINDOW) {
      recentToasts.delete(k);
    }
  }
  
  return true;
}

// Simple toast implementation
const showToast = (type: 'info' | 'success' | 'warning', title: string, description?: string, duration = 4000) => {
  // Deduplication check
  if (!shouldShowToast(title, description)) {
    return;
  }
  
  // Create toast container if it doesn't exist
  let container = document.getElementById('realtime-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'realtime-toast-container';
    container.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  
  const colors = {
    info: { border: '#3b82f6', bg: '#eff6ff' },
    success: { border: '#10b981', bg: '#ecfdf5' },
    warning: { border: '#f59e0b', bg: '#fffbeb' },
  };

  const icons = { info: '🔵', success: '✅', warning: '⚠️' };

  toast.style.cssText = `
    background: ${colors[type].bg};
    border-radius: 12px;
    padding: 14px 18px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    border-left: 4px solid ${colors[type].border};
    min-width: 300px;
    max-width: 450px;
    animation: slideIn 0.3s ease-out;
    pointer-events: auto;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  toast.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <span style="font-size: 18px; flex-shrink: 0;">${icons[type]}</span>
      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 600; color: #1f2937; font-size: 14px; line-height: 1.4;">${title}</div>
        ${description ? `<div style="color: #4b5563; font-size: 13px; margin-top: 6px; line-height: 1.4;">${description}</div>` : ''}
      </div>
    </div>
  `;

  if (!document.getElementById('realtime-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'realtime-toast-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
};

export function useRealtimeSync(currentUserId?: string) {
  const { addItems, removeItemsByPoId, updateTrack, updateItem, upsertIssue } = useItemsStore();
  
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
    const data = rawData as POCreatedEvent;
    console.log('[Realtime] PO created:', data);
    
    // Inject new item cards at top of everyone's Tasks page
    addItems(data.items);
    
    showToast('success', `PO Baru: ${data.poNumber}`, 
      `${data.clientName} · ${data.items.length} item · oleh ${data.actorName}`, 5000);
  }, [addItems]);

  // ─── TRACK PROGRESS UPDATED ───────────────────────────────────
  const handleTrackUpdated = useCallback((rawData: unknown) => {
    const data = rawData as TrackUpdatedEvent;
    
    // Deduplication: create unique event ID
    const eventId = `track-${data.itemId}-${data.trackDepartment}-${data.newProgress}-${Date.now()}`;
    if (!markEventProcessed(eventId)) {
      console.log('[Realtime] Duplicate track event ignored:', eventId);
      return;
    }
    
    console.log('[Realtime] Track updated:', data);
    
    // Only that one progress bar moves
    updateTrack(data.itemId, data.trackDepartment, data.track);
    
    // Don't show toast to the person who made the update
    if (data.actorId === currentUserId) return;
    
    const deptLabel: Record<string, string> = {
      drafting: 'Draft', 
      purchasing: 'Purch',
      production: 'Prod', 
      qc: 'QC', 
      delivery: 'Delivery',
    };
    
    showToast('info', `${data.actorName} · ${data.itemName}`, 
      `${deptLabel[data.trackDepartment] || data.trackDepartment}: ${data.oldProgress}% → ${data.newProgress}%`, 3000);
  }, [currentUserId, updateTrack]);

  // ─── ISSUE CREATED ────────────────────────────────────────────
  const handleIssueCreated = useCallback((rawData: unknown) => {
    const data = rawData as IssueEvent;
    console.log('[Realtime] Issue created:', data);
    
    // Issue badge appears on that item card
    upsertIssue(data.itemId, data.issue);
    
    showToast('warning', `⚠️ Issue Baru: ${data.issue.title}`, 
      `${data.itemName} · ${data.poNumber} · oleh ${data.actorName}`, 5000);
  }, [upsertIssue]);

  // ─── ISSUE RESOLVED ───────────────────────────────────────────
  const handleIssueResolved = useCallback((rawData: unknown) => {
    const data = rawData as IssueEvent;
    console.log('[Realtime] Issue resolved:', data);
    
    // Issue badge updates on that item card with full data
    upsertIssue(data.itemId, { 
      ...data.issue, 
      status: 'resolved',
      resolver: data.issue.resolver,
      resolvedAt: data.issue.resolvedAt,
    });
    
    showToast('success', `✅ Issue Selesai: ${data.issue.title}`, 
      `${data.itemName} · oleh ${data.actorName}`, 3000);
  }, [upsertIssue]);

  // ─── ITEM DELIVERED ───────────────────────────────────────────
  const handleItemDelivered = useCallback((rawData: unknown) => {
    const data = rawData as ItemDeliveredEvent;
    console.log('[Realtime] Item delivered:', data);
    
    // Delivery status updates on that item card
    updateItem(data.itemId, {
      quantity_delivered: data.quantityDelivered,
      is_delivered: data.isDelivered,
    });
    
    showToast('success', `📦 Terkirim: ${data.itemName}`, 
      `${data.poNumber} · oleh ${data.actorName}`, 4000);
  }, [updateItem]);

  // ─── PO CANCELLED / ARCHIVED ─────────────────────────────────
  const handlePOStatusChanged = useCallback((rawData: unknown) => {
    const data = rawData as POStatusChangedEvent;
    console.log('[Realtime] PO status changed:', data);
    
    if (['cancelled', 'archived'].includes(data.newStatus)) {
      // Remove those item cards from Tasks page for everyone
      removeItemsByPoId(data.poId);
      
      showToast('info', `PO ${data.poNumber} ${data.newStatus}`, 
        `oleh ${data.actorName}`, 4000);
    }
  }, [removeItemsByPoId]);

  // ─── PO URGENT TOGGLED ────────────────────────────────────────
  const handlePOUrgentChanged = useCallback((rawData: unknown) => {
    const data = rawData as POUrgentChangedEvent;
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
      showToast('warning', `🔴 URGENT: ${data.poNumber}`, 
        `oleh ${data.actorName}`, 5000);
    }
  }, [updateItem]);

  // ─── FINANCE UPDATED ──────────────────────────────────────────
  const handleFinanceUpdated = useCallback((rawData: unknown) => {
    const data = rawData as FinanceEvent;
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
    let description = '';
    
    if (data.action === 'paid') {
      title = `${data.actorName} Payment-${data.poNumber}`;
      description = 'Payment Received';
    } else if (data.action === 'invoiced') {
      title = `${data.actorName} Invoice-${data.poNumber}`;
      description = `Create Invoice : "${data.invoiceNumber || 'N/A'}"`;
    } else if (data.action === 'unpaid') {
      title = `${data.actorName} Payment-${data.poNumber}`;
      description = 'Payment Cancelled';
    } else if (data.action === 'uninvoiced') {
      title = `${data.actorName} Invoice-${data.poNumber}`;
      description = 'Invoice Cancelled';
    }
    
    showToast('info', title, description, 4000);
  }, [updateItem]);

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
    })(pusherKey, {
      cluster: pusherCluster,
    });

    const channel = pusher.subscribe('po-channel');

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
      channel.unbind_all();
      pusher.unsubscribe('po-channel');
      pusher.disconnect();
    };
  }, [handlePOCreated, handleTrackUpdated, handleIssueCreated, handleIssueResolved, handleItemDelivered, handlePOStatusChanged, handlePOUrgentChanged, handleFinanceUpdated]);
}
