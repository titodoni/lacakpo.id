'use client';

import { useState, useEffect } from 'react';
import { cn, canUpdateTrack } from '@/lib/utils';
import { IssueBadge } from './IssueBadge';
import { AlertTriangle } from 'lucide-react';

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
  creator: {
    id: string;
    name: string;
    role?: string;
  };
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

// Color Palette
const colors = {
  primary: '#003049',
  danger: '#d62828',
  accent: '#f77f00',
};

const deptLabels: Record<string, string> = {
  drafting: 'Drafting',
  purchasing: 'Purchasing',
  production: 'Produksi',
  qc: 'QC',
  delivery: 'Delivery',
};

const workflowOrder: Record<string, number> = {
  drafting: 1,
  purchasing: 2,
  production: 3,
  qc: 4,
  delivery: 5,
};

// Card status colors
const cardStatusColors: Record<string, { border: string; bg: string; label: string; labelColor: string }> = {
  urgent: {
    border: colors.danger,
    bg: '#fee2e2',
    label: 'PENTING',
    labelColor: colors.danger,
  },
  delayed: {
    border: colors.accent,
    bg: '#ffedd5',
    label: 'TERLAMBAT',
    labelColor: colors.accent,
  },
  ongoing: {
    border: colors.primary,
    bg: '#e0f2fe',
    label: 'BERJALAN',
    labelColor: colors.primary,
  },
  'delivery-close': {
    border: '#f59e0b',
    bg: '#fef3c7',
    label: 'SIAP KIRIM',
    labelColor: '#f59e0b',
  },
  completed: {
    border: '#16a34a',
    bg: '#dcfce7',
    label: 'SUDAH DIBAYAR',
    labelColor: '#16a34a',
  },
  normal: {
    border: '#e5e7eb',
    bg: '#f9fafb',
    label: '',
    labelColor: '',
  },
};

function sortTracksByWorkflowOrder(tracks: Track[]): Track[] {
  return [...tracks].sort((a, b) => {
    return (workflowOrder[a.department] || 99) - (workflowOrder[b.department] || 99);
  });
}

export function ItemCard({
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
  const sortedTracks = sortTracksByWorkflowOrder(item.tracks);
  
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
  
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleUpdateProgress = async (trackId: string, newProgress: number) => {
    const oldProgress = displayProgress;
    setDisplayProgress(newProgress);
    setIsEditing(false);
    setIsSaving(true);
    
    try {
      const res = await fetch(`/api/tracks/${trackId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newProgress }),
      });
      
      if (res.ok) {
        setIsSaving(false);
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2000);
        onUpdate?.();
      } else {
        setDisplayProgress(oldProgress);
        setIsSaving(false);
        alert('Gagal menyimpan progress');
      }
    } catch (error) {
      setDisplayProgress(oldProgress);
      setIsSaving(false);
      alert('Gagal menyimpan progress');
    }
  };

  const handleUpdateDelivery = async (newQuantity: number) => {
    const oldQuantity = displayDelivered;
    setDisplayDelivered(newQuantity);
    setIsEditingDelivery(false);
    setIsSaving(true);
    
    try {
      const res = await fetch(`/api/items/${item.id}/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantityDelivered: newQuantity }),
      });
      
      if (res.ok) {
        setIsSaving(false);
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2000);
        onUpdate?.();
      } else {
        setDisplayDelivered(oldQuantity);
        setIsSaving(false);
        alert('Gagal menyimpan quantity delivered');
      }
    } catch (error) {
      setDisplayDelivered(oldQuantity);
      setIsSaving(false);
      alert('Gagal menyimpan quantity delivered');
    }
  };

  const getDaysLeftText = () => {
    if (daysLeft === null) return null;
    if (isOverdue) return `${Math.abs(daysLeft)}h telat`;
    if (daysLeft === 0) return 'Hari ini';
    return `${daysLeft}h lagi`;
  };

  const statusColors = cardStatusColors[cardStatus] || cardStatusColors.normal;

  // For workers (non-admin/manager), clicking card enters edit mode instead of navigation
  const shouldNavigate = navigateOnClick || !canEdit;

  const cardContent = (
    <>
      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: colors.accent }}>
        {/* Item Name */}
        <h3 className="font-bold text-lg truncate shrink-0 max-w-[200px]" style={{ color: colors.primary }}>
          {item.itemName}
        </h3>
        
        <span style={{ color: colors.accent }}>-</span>
        
        {/* Company Name */}
        <span className="font-semibold text-base truncate shrink-0 max-w-[150px]" style={{ color: colors.primary }}>
          {item.purchaseOrder.client.name}
        </span>
        
        <span style={{ color: colors.accent }}>-</span>
        
        {/* PO Number */}
        <span 
          className="font-mono text-sm px-1.5 py-0.5 rounded shrink-0" 
          style={{ backgroundColor: '#ffffff', color: colors.primary }}
          title={`PO ID: ${item.purchaseOrder?.id || 'N/A'}`}
        >
          {item.purchaseOrder.poNumber}
        </span>
        
        <span style={{ color: colors.accent }}>•</span>
        
        {/* Quantity */}
        <span className="text-sm shrink-0" style={{ color: colors.primary }}>
          {item.quantityTotal} {item.quantityUnit}
        </span>

        {/* Status Badge */}
        {cardStatus !== 'normal' && statusColors.label && (
          <>
            <span style={{ color: colors.accent }}>•</span>
            <span 
              className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: statusColors.labelColor + '20', color: statusColors.labelColor }}
            >
              {statusColors.label}
            </span>
          </>
        )}

        {/* Vendor Badge */}
        {isVendorJob && (
          <>
            <span style={{ color: colors.accent }}>•</span>
            <span 
              className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}
              title={vendorName || 'Vendor'}
            >
              VENDOR
            </span>
          </>
        )}
        
        {/* Spacer */}
        <div className="flex-1" />
        
        {/* Right Side */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <IssueBadge issues={issues} compact />
          {daysLeft !== null && (
            <span className="text-sm font-bold px-2 py-1 rounded-lg whitespace-nowrap text-white"
              style={{
                backgroundColor: isOverdue ? colors.danger : isUrgent ? colors.danger : colors.primary,
              }}
            >
              {getDaysLeftText()}
            </span>
          )}
        </div>
      </div>

      <div className="px-3 pb-3" style={{ backgroundColor: '#ffffff' }}>
        {/* Departments Inline */}
        <div className="flex items-center gap-3 text-sm mb-2" style={{ color: colors.primary }}>
          {sortedTracks.map((track, i) => (
            <span key={track.id} className="flex items-center">
              <span className="font-medium">{deptLabels[track.department]}</span>
              <span className="ml-1 font-bold font-mono"
                style={{ color: track.progress === 100 ? colors.danger : colors.primary }}
              >
                {track.progress}%
              </span>
              {i < sortedTracks.length - 1 && <span className="ml-3" style={{ color: colors.accent }}>-</span>}
            </span>
          ))}
        </div>

        {/* User's Track */}
        {myTrack && (
          <div className="pt-2 border-t" style={{ borderColor: colors.accent }} onClick={(e) => e.stopPropagation()}>
            {isEditing ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold" style={{ color: colors.primary }}>
                    {userDept ? deptLabels[userDept] : ''}
                  </span>
                  <span className="text-xl font-black font-mono" style={{ color: colors.primary }}>
                    {editValue}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editValue}
                  onChange={(e) => setEditValue(parseInt(e.target.value))}
                  className="w-full h-2.5 rounded-full appearance-none cursor-pointer mb-2"
                  style={{
                    background: `linear-gradient(to right, ${colors.primary} ${editValue}%, ${colors.accent} ${editValue}%)`,
                  }}
                />
                
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {[0, 25, 50, 75, 100].map((q) => (
                    <button
                      key={q}
                      onClick={() => setEditValue(q)}
                      className="py-1.5 text-xs font-bold rounded-lg transition-all"
                      style={{
                        backgroundColor: editValue === q ? colors.primary : colors.accent,
                        color: editValue === q ? 'white' : colors.primary,
                      }}
                    >
                      {q}%
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 text-xs font-bold rounded-lg transition-colors"
                    style={{ backgroundColor: colors.accent, color: colors.primary }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleUpdateProgress(myTrack.id, editValue)}
                    disabled={editValue === displayProgress || isSaving}
                    className="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                    style={{
                      backgroundColor: editValue === displayProgress || isSaving ? colors.accent : colors.primary,
                      color: editValue === displayProgress || isSaving ? colors.primary : 'white',
                    }}
                  >
                    {isSaving ? 'Menyimpan...' : 'Update'}
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={handleProgressClick}
                className={canEdit ? 'cursor-pointer' : ''}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold" style={{ color: colors.primary }}>
                    {userDept ? deptLabels[userDept] : ''}
                  </span>
                  <span className="text-xl font-black font-mono"
                    style={{ color: displayProgress === 100 ? colors.danger : colors.primary }}
                  >
                    {displayProgress}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.accent }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${displayProgress}%`,
                      backgroundColor: displayProgress === 100 ? colors.danger : colors.primary,
                    }} 
                  />
                </div>
                {canEdit && (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px]" style={{ color: colors.accent }}>Klik untuk edit progress</p>
                    {savedFeedback && (
                      <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: colors.danger }}>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Tersimpan
                      </span>
                    )}
                    {isSaving && (
                      <span className="text-[10px] font-medium" style={{ color: colors.primary }}>Menyimpan...</span>
                    )}
                  </div>
                )}
                
                {/* Vendor Job Block Message */}
                {isBlockedByVendor && (
                  <div className="mt-2 p-2 rounded-lg text-center" style={{ backgroundColor: '#3b82f620' }}>
                    <p className="text-xs font-medium" style={{ color: '#3b82f6' }}>
                      Dikerjakan Vendor: {vendorName}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: colors.primary }}>
                      Production tidak dapat update progress
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Delivery Section for Delivery Users */}
        {isDeliveryUser && (
          <div className="pt-2 border-t mt-2" style={{ borderColor: colors.accent }} onClick={(e) => e.stopPropagation()}>
            {isEditingDelivery ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold" style={{ color: colors.primary }}>
                    Quantity Delivered
                  </span>
                  <span className="text-xl font-black font-mono" style={{ color: colors.primary }}>
                    {deliveryValue} / {item.quantityTotal} {item.quantityUnit}
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max={item.quantityTotal}
                  step="1"
                  value={deliveryValue}
                  onChange={(e) => setDeliveryValue(parseInt(e.target.value))}
                  className="w-full h-2.5 rounded-full appearance-none cursor-pointer mb-2"
                  style={{
                    background: `linear-gradient(to right, ${colors.primary} ${(deliveryValue / item.quantityTotal) * 100}%, ${colors.accent} ${(deliveryValue / item.quantityTotal) * 100}%)`,
                  }}
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingDelivery(false)}
                    className="flex-1 py-2 text-xs font-bold rounded-lg transition-colors"
                    style={{ backgroundColor: colors.accent, color: colors.primary }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleUpdateDelivery(deliveryValue)}
                    disabled={deliveryValue === displayDelivered || isSaving}
                    className="flex-1 py-2 text-xs font-bold rounded-lg transition-all"
                    style={{
                      backgroundColor: deliveryValue === displayDelivered || isSaving ? colors.accent : colors.primary,
                      color: deliveryValue === displayDelivered || isSaving ? colors.primary : 'white',
                    }}
                  >
                    {isSaving ? 'Menyimpan...' : 'Update'}
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={handleProgressClick}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold" style={{ color: colors.primary }}>
                    Quantity Delivered
                  </span>
                  <span className="text-xl font-black font-mono"
                    style={{ color: displayDelivered >= item.quantityTotal ? colors.danger : colors.primary }}
                  >
                    {displayDelivered} / {item.quantityTotal} {item.quantityUnit}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.accent }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(displayDelivered / item.quantityTotal) * 100}%`,
                      backgroundColor: displayDelivered >= item.quantityTotal ? colors.danger : colors.primary,
                    }} 
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px]" style={{ color: colors.accent }}>Klik untuk edit quantity</p>
                  {savedFeedback && (
                    <span className="text-[10px] font-bold flex items-center gap-0.5" style={{ color: colors.danger }}>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Tersimpan
                    </span>
                  )}
                  {isSaving && (
                    <span className="text-[10px] font-medium" style={{ color: colors.primary }}>Menyimpan...</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report Issue Button */}
        {canReportIssue && onReportIssue && !isEditing && !isEditingDelivery && (
          <div className="mt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onReportIssue(item)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-md border transition-colors"
              style={{
                backgroundColor: 'transparent',
                borderColor: colors.danger,
                color: colors.danger,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.danger;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.danger;
              }}
            >
              <AlertTriangle className="w-3 h-3" />
              Lapor Masalah
            </button>
          </div>
        )}
      </div>
    </>
  );

  if (shouldNavigate) {
    const poId = item.purchaseOrder?.id;
    if (!poId) {
      console.error('ItemCard: Missing purchaseOrder.id for item', item.id, item.itemName);
    }
    return (
      <a
        href={`/pos/${poId || ''}`}
        className="block rounded-xl overflow-hidden transition-all hover:shadow-lg"
        style={{
          backgroundColor: statusColors.bg,
          border: `2px solid ${statusColors.border}`,
          boxShadow: '0 2px 8px rgba(0,8,7,0.08)',
          textDecoration: 'none',
        }}
      >
        {cardContent}
      </a>
    );
  }

  // For workers: clicking card enters edit mode
  return (
    <div
      onClick={handleProgressClick}
      className="block rounded-xl overflow-hidden transition-all hover:shadow-lg cursor-pointer"
      style={{
        backgroundColor: statusColors.bg,
        border: `2px solid ${statusColors.border}`,
        boxShadow: '0 2px 8px rgba(0,8,7,0.08)',
      }}
    >
      {cardContent}
    </div>
  );
}
