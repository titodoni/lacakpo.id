'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import { cn, canUpdateTrack } from '@/lib/utils';
import { IssueBadge } from './IssueBadge';
import { AlertTriangle, X, AlertCircle, Info, CheckCircle2, User, Pencil, Clock } from 'lucide-react';

// Custom debounce hook
function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

export interface Track {
  id: string;
  department: string;
  progress: number;
  updatedAt: string | null;
  updater: { name: string } | null;
}

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'resolved';
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
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
}

export interface Item {
  id: string;
  itemName: string;
  specification: string | null;
  quantityTotal: number;
  quantityDelivered: number;
  quantityUnit: string;
  productionType: string;
  purchaseOrder: {
    id: string;
    poNumber: string;
    client: { name: string };
    deliveryDeadline: string | null;
    poDate: string;
    isUrgent?: boolean;
    isVendorJob?: boolean;
    vendorName?: string | null;
    isPaid?: boolean;
  };
  tracks: Track[];
  issues?: Issue[];
}

interface ItemCardProps {
  item: Item;
  userRole: string;
  userDept: string | null;
  userId: string;
  isAdmin: boolean;
  onUpdate?: () => void;
  onReportIssue?: (item: Item) => void;
  // Vendor job and status coloring props
  isVendorJob?: boolean;
  vendorName?: string | null;
  cardStatus?: 'urgent' | 'delayed' | 'ongoing' | 'delivery-close' | 'completed' | 'normal';
  // Click behavior
  navigateOnClick?: boolean; // If false, click will trigger edit mode (for workers)
}

const deptLabels: Record<string, string> = {
  drafting: 'Draft',
  purchasing: 'Purch',
  production: 'Prod',
  qc: 'QC',
  delivery: 'Deliv',
};

const workflowOrder: Record<string, number> = {
  drafting: 1,
  purchasing: 2,
  production: 3,
  qc: 4,
  delivery: 5,
};

const priorityConfig = {
  high: {
    label: 'Tinggi',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle,
    dotColor: 'bg-red-500',
  },
  medium: {
    label: 'Sedang',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: AlertCircle,
    dotColor: 'bg-amber-500',
  },
  low: {
    label: 'Rendah',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Info,
    dotColor: 'bg-blue-500',
  },
};

// Issues Popup Component
function IssuesPopup({ 
  issues, 
  onClose, 
  onReportIssue,
  itemName 
}: { 
  issues: Issue[]; 
  onClose: () => void;
  onReportIssue?: () => void;
  itemName: string;
}) {
  const openIssues = issues.filter((i) => i.status === 'open');
  const resolvedIssues = issues.filter((i) => i.status === 'resolved');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const renderIssue = (issue: Issue) => {
    const config = priorityConfig[issue.priority];
    const Icon = config.icon;
    const isExpanded = expandedIssue === issue.id;
    const isResolved = issue.status === 'resolved';

    return (
      <div
        key={issue.id}
        className={cn(
          'border rounded-lg overflow-hidden transition-all',
          isResolved ? 'bg-muted/50 border-border opacity-75' : 'bg-card border-border'
        )}
      >
        <div
          className="p-3 cursor-pointer"
          onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', config.color.split(' ')[1])} />
              <div className="flex-1 min-w-0">
                <p className={cn('font-medium text-sm', isResolved && 'line-through text-muted-foreground')}>
                  {issue.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={cn('text-xs px-1.5 py-0.5 rounded border font-medium', config.color)}>
                    {config.label}
                  </span>
                  {isResolved && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">
                      Selesai
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t border-border">
            {issue.description && (
              <p className="text-sm text-muted-foreground mt-2">{issue.description}</p>
            )}
            {issue.creator && (
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <User className="w-3 h-3" />
                <span>Dilaporkan oleh {issue.creator.name}</span>
              </div>
            )}
            {isResolved && issue.resolver && (
              <div className="flex items-center gap-2 mt-1 text-xs text-emerald-600">
                <CheckCircle2 className="w-3 h-3" />
                <span>Diselesaikan oleh {issue.resolver.name}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div 
        className="bg-card rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">Masalah Item</h3>
            <p className="text-sm text-muted-foreground">{itemName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {issues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Tidak ada masalah dilaporkan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {openIssues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Masalah Terbuka ({openIssues.length})
                  </h4>
                  {openIssues.map(renderIssue)}
                </div>
              )}

              {resolvedIssues.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Selesai ({resolvedIssues.length})
                  </h4>
                  {resolvedIssues.map(renderIssue)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {onReportIssue && (
          <div className="p-4 border-t border-border">
            <button
              onClick={onReportIssue}
              className="w-full py-3 bg-destructive text-destructive-foreground font-medium rounded-xl hover:bg-destructive/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Laporkan Masalah Baru
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export const ItemCard = memo(function ItemCard({
  item,
  userRole,
  userDept,
  userId,
  isAdmin,
  onUpdate,
  onReportIssue,
  isVendorJob,
  vendorName,
  cardStatus = 'normal',
  navigateOnClick = true,
}: ItemCardProps) {
  const issues = item.issues || [];
  const openIssues = issues.filter((i) => i.status === 'open');
  const sortedTracks = [...item.tracks].sort((a, b) => {
    return (workflowOrder[a.department] || 99) - (workflowOrder[b.department] || 99);
  });
  
  const myTrack = userDept && userDept !== 'delivery'
    ? item.tracks.find((t) => t.department === userDept)
    : null;

  // Track editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(myTrack?.progress || 0);
  
  // Delivery editing state
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [deliveryValue, setDeliveryValue] = useState(item.quantityDelivered);
  const [displayDelivered, setDisplayDelivered] = useState(item.quantityDelivered);
  
  // Issues popup state
  const [showIssuesPopup, setShowIssuesPopup] = useState(false);
  
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs for preventing duplicate requests and tracking pending operations
  const pendingSaveRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Vendor job: production dept cannot update progress
  const isProductionDept = userDept === 'production';
  const isBlockedByVendor = isVendorJob && isProductionDept;
  
  const isDeliveryUser = userDept === 'delivery';
  const canEdit = (myTrack && canUpdateTrack(userRole, myTrack.department) && !isBlockedByVendor) || isDeliveryUser;
  const canReportIssue = !['manager'].includes(userRole);

  const getDaysLeft = () => {
    if (!item.purchaseOrder.deliveryDeadline) return null;
    const deadline = new Date(item.purchaseOrder.deliveryDeadline);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = getDaysLeft();
  const isOverdue = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

  useEffect(() => {
    if (myTrack) {
      setDisplayProgress(myTrack.progress);
    }
  }, [myTrack?.progress]);

  // Update delivery value when item changes
  useEffect(() => {
    setDisplayDelivered(item.quantityDelivered);
    setDeliveryValue(item.quantityDelivered);
  }, [item.quantityDelivered]);
  
  // Cleanup: abort pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleProgressClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeliveryUser && !isEditingDelivery && !isSaving) {
      setIsEditingDelivery(true);
      setDeliveryValue(displayDelivered);
      return;
    }
    if (canEdit && !isEditing && !isSaving && myTrack) {
      setIsEditing(true);
      setEditValue(displayProgress);
    }
  };

  // Optimistic update for better performance
  const handleUpdateProgress = async (trackId: string, newProgress: number) => {
    if (pendingSaveRef.current) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const oldProgress = displayProgress;
    setDisplayProgress(newProgress);
    setIsEditing(false);
    setIsSaving(true);
    pendingSaveRef.current = true;
    
    abortControllerRef.current = new AbortController();
    
    try {
      const res = await fetch(`/api/tracks/${trackId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newProgress }),
        signal: abortControllerRef.current.signal,
      });
      
      if (res.ok) {
        setIsSaving(false);
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2000);
        onUpdate?.();
      } else {
        setDisplayProgress(oldProgress);
        setIsSaving(false);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setIsSaving(false);
        return;
      }
      setDisplayProgress(oldProgress);
      setIsSaving(false);
    } finally {
      pendingSaveRef.current = false;
      abortControllerRef.current = null;
    }
  };
  
  // Debounced version for slider updates
  const debouncedUpdateProgress = useDebouncedCallback(
    (trackId: string, newProgress: number) => {
      handleUpdateProgress(trackId, newProgress);
    },
    300
  );

  const handleUpdateDelivery = async (newQuantity: number) => {
    if (pendingSaveRef.current) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const oldQuantity = displayDelivered;
    setDisplayDelivered(newQuantity);
    setIsEditingDelivery(false);
    setIsSaving(true);
    pendingSaveRef.current = true;
    
    abortControllerRef.current = new AbortController();
    
    try {
      const res = await fetch(`/api/items/${item.id}/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantityDelivered: newQuantity }),
        signal: abortControllerRef.current.signal,
      });
      
      if (res.ok) {
        setIsSaving(false);
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2000);
        onUpdate?.();
      } else {
        setDisplayDelivered(oldQuantity);
        setIsSaving(false);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setIsSaving(false);
        return;
      }
      setDisplayDelivered(oldQuantity);
      setIsSaving(false);
    } finally {
      pendingSaveRef.current = false;
      abortControllerRef.current = null;
    }
  };
  
  const debouncedUpdateDelivery = useDebouncedCallback(
    (newQuantity: number) => {
      handleUpdateDelivery(newQuantity);
    },
    300
  );

  const getDaysLeftText = () => {
    if (daysLeft === null) return null;
    if (isOverdue) return `${Math.abs(daysLeft)}h telat`;
    if (daysLeft === 0) return 'Hari ini';
    return `${daysLeft}h lagi`;
  };

  // Helper function for deadline display with visual urgency indicators
  // Note: 'h' means 'hari' (days), not hours
  function getDeadlineDisplay(deadline: string | null): { label: string; className: string } {
    if (!deadline) {
      return { label: 'Tidak ada deadline', className: 'text-muted-foreground' };
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      // Past deadline
      return { label: `${Math.abs(diffDays)}h TELAT`, className: 'text-red-600 font-bold' };
    } else if (diffDays <= 48) {
      // 1-48 days remaining
      return { label: `${diffDays}h lagi`, className: 'text-orange-500 font-semibold' };
    } else {
      // More than 48 days remaining
      return { label: `${diffDays}h lagi`, className: 'text-emerald-600' };
    }
  }

  const shouldNavigate = navigateOnClick || !canEdit;

  const handleIssueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowIssuesPopup(true);
  };

  // Card status styles using theme colors
  const getCardStyles = () => {
    switch (cardStatus) {
      case 'urgent':
        return 'bg-red-50 border-red-400';
      case 'delayed':
        return 'bg-orange-50 border-orange-400';
      case 'ongoing':
        return 'bg-blue-50 border-blue-400';
      case 'delivery-close':
        return 'bg-amber-50 border-amber-400';
      case 'completed':
        return 'bg-emerald-50 border-emerald-400';
      default:
        return 'bg-card border-border';
    }
  };

  // Urgent item styles - adds left border and subtle red tint
  const poIsUrgent = item.purchaseOrder.isUrgent;
  const getUrgentStyles = () => {
    if (poIsUrgent) {
      return 'border-l-4 border-l-destructive bg-destructive/5';
    }
    return '';
  };

  const getStatusBadge = () => {
    switch (cardStatus) {
      case 'urgent':
        return <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-red-100 text-red-600">PENTING</span>;
      case 'delayed':
        return <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">TERLAMBAT</span>;
      case 'ongoing':
        return <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">BERJALAN</span>;
      case 'delivery-close':
        return <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">SIAP KIRIM</span>;
      case 'completed':
        return <span className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">SUDAH DIBAYAR</span>;
      default:
        return null;
    }
  };

  const cardContent = (
    <>
      {/* Header - Mobile Optimized with Theme Colors */}
      <div className="px-2 sm:px-3 py-2 sm:py-2.5 flex flex-wrap items-center gap-1.5 sm:gap-2 bg-accent/10">
        {/* Item Name */}
        <h3 className="font-bold text-sm sm:text-lg truncate max-w-[120px] sm:max-w-[200px] text-foreground">
          {item.itemName}
        </h3>
        
        <span className="hidden sm:inline text-accent">-</span>
        
        {/* Company Name */}
        <span className="font-semibold text-xs sm:text-base truncate max-w-[100px] sm:max-w-[150px] text-foreground">
          {item.purchaseOrder.client.name}
        </span>
        
        <span className="hidden sm:inline text-accent">-</span>
        
        {/* PO Number */}
        <span 
          className="font-mono text-xs sm:text-sm px-1 sm:px-1.5 py-0.5 rounded shrink-0 bg-background text-foreground"
        >
          {item.purchaseOrder.poNumber}
        </span>
        
        <span className="hidden sm:inline text-accent">•</span>
        
        {/* Quantity */}
        <span className="text-xs sm:text-sm shrink-0 text-foreground">
          {item.quantityTotal} {item.quantityUnit}
        </span>

        {/* Status Badge */}
        {cardStatus !== 'normal' && (
          <span className="inline-flex items-center gap-1.5">
            {getStatusBadge()}
            {poIsUrgent && (
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            )}
          </span>
        )}

        {/* Vendor Badge */}
        {isVendorJob && (
          <>
            <span className="hidden sm:inline text-accent">•</span>
            <span 
              className="text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 bg-blue-100 text-blue-600"
              title={vendorName || 'Vendor'}
            >
              <span className="sm:hidden">V</span>
              <span className="hidden sm:inline">VENDOR</span>
            </span>
          </>
        )}
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Right Side - Issues & Days Left */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Clickable Issues Badge */}
          {openIssues.length > 0 && (
            <button
              onClick={handleIssueClick}
              className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-white transition-transform active:scale-95 bg-destructive hover:bg-destructive/90"
              title={`${openIssues.length} masalah terbuka - Klik untuk lihat detail`}
            >
              <AlertTriangle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {openIssues.length}
            </button>
          )}
          
          {item.purchaseOrder.deliveryDeadline && (
            (() => {
              const { label, className } = getDeadlineDisplay(item.purchaseOrder.deliveryDeadline);
              return (
                <span className={cn('inline-flex items-center gap-1 text-xs sm:text-sm', className)}>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {label}
                </span>
              );
            })()
          )}
        </div>
      </div>

      <div className="px-2 sm:px-3 pb-2 sm:pb-3 bg-card">
        {/* SECTION A: Own Department Track (tappable) */}
        {myTrack && canEdit && !isEditing && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleProgressClick}
              className="w-full min-h-[64px] px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 active:scale-[0.98] transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex-1">
                <span className="text-2xl font-bold text-primary">{displayProgress}%</span>
                {/* Progress bar below */}
                <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 bg-primary"
                    style={{ width: `${displayProgress}%` }} 
                  />
                </div>
              </div>
              <Pencil className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </div>
        )}

        {/* SECTION A: Delivery User (special case - no track) */}
        {isDeliveryUser && canEdit && !isEditingDelivery && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleProgressClick}
              className="w-full min-h-[64px] px-4 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 active:scale-[0.98] transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex-1">
                <span className="text-2xl font-bold text-primary">{displayDelivered}</span>
                <span className="text-sm text-muted-foreground">/{item.quantityTotal}</span>
              </div>
              <Pencil className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </div>
        )}

        {/* SECTION A: Edit mode for track */}
        {myTrack && isEditing && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">{deptLabels[userDept || '']}</span>
              <span className="text-xl font-bold text-foreground">{editValue}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={editValue}
              onChange={(e) => setEditValue(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer mb-3 accent-primary"
            />
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[0, 25, 50, 75, 100].map((q) => (
                <button
                  key={q}
                  onClick={() => setEditValue(q)}
                  className="py-2 text-xs font-bold rounded-lg transition-all bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  {q}%
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 text-xs font-bold rounded-lg transition-colors bg-muted text-foreground hover:bg-muted/80"
              >
                Batal
              </button>
              <button
                onClick={() => handleUpdateProgress(myTrack.id, editValue)}
                disabled={editValue === displayProgress || isSaving}
                className="flex-1 py-2 text-xs font-bold rounded-lg transition-all bg-primary text-primary-foreground disabled:opacity-50"
              >
                {isSaving ? '...' : 'Update'}
              </button>
            </div>
          </div>
        )}

        {/* SECTION A: Edit mode for delivery */}
        {isDeliveryUser && isEditingDelivery && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-foreground">Qty Delivered</span>
              <span className="text-xl font-bold text-foreground">{deliveryValue}</span>
            </div>
            <input
              type="range"
              min="0"
              max={item.quantityTotal}
              step="1"
              value={deliveryValue}
              onChange={(e) => setDeliveryValue(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer mb-3 accent-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingDelivery(false)}
                className="flex-1 py-2 text-xs font-bold rounded-lg transition-colors bg-muted text-foreground hover:bg-muted/80"
              >
                Batal
              </button>
              <button
                onClick={() => handleUpdateDelivery(deliveryValue)}
                disabled={deliveryValue === displayDelivered || isSaving}
                className="flex-1 py-2 text-xs font-bold rounded-lg transition-all bg-primary text-primary-foreground disabled:opacity-50"
              >
                {isSaving ? '...' : 'Update'}
              </button>
            </div>
          </div>
        )}

        {/* SECTION B: Other Departments (read-only, one line) */}
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {sortedTracks
            .filter((track) => track.department !== userDept)
            .map((track, index, arr) => {
              const label = deptLabels[track.department] || track.department;
              let display = '';
              if (track.progress === 100) {
                display = `${label} ✅`;
              } else if (track.progress > 0) {
                display = `${label} ${track.progress}%`;
              } else {
                display = `${label} –`;
              }
              return (
                <span key={track.id}>
                  {display}
                  {index < arr.length - 1 && <span className="ml-2">·</span>}
                </span>
              );
            })}
        </div>

        {/* Report Issue Button */}
        {canReportIssue && onReportIssue && !isEditing && !isEditingDelivery && (
          <div className="mt-3 flex justify-end" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onReportIssue(item)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-md border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              <span className="hidden sm:inline">Lapor</span>
            </button>
          </div>
        )}
      </div>

      {/* Issues Popup */}
      {showIssuesPopup && (
        <IssuesPopup
          issues={issues}
          itemName={item.itemName}
          onClose={() => setShowIssuesPopup(false)}
          onReportIssue={onReportIssue ? () => {
            setShowIssuesPopup(false);
            onReportIssue(item);
          } : undefined}
        />
      )}
    </>
  );

  if (shouldNavigate) {
    const poId = item.purchaseOrder?.id;
    return (
      <Link
        href={`/pos/${poId || ''}`}
        prefetch={true}
        className={cn(
          "block rounded-xl overflow-hidden transition-all hover:shadow-lg border-2",
          getCardStyles(),
          getUrgentStyles()
        )}
        style={{ textDecoration: 'none' }}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      onClick={handleProgressClick}
      className={cn(
        "block rounded-xl overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2",
        getCardStyles(),
        getUrgentStyles()
      )}
    >
      {cardContent}
    </div>
  );
});
