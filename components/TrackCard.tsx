'use client';

import { useState } from 'react';
import { cn, getProgressColor, canUpdateTrack } from '@/lib/utils';
import { SmartProgressInput } from './SmartProgressInput';

interface Track {
  id: string;
  department: string;
  progress: number;
  updatedAt: string | null;
  updater: { name: string } | null;
}

interface TrackCardProps {
  track: Track;
  userRole: string;
  onUpdate: () => void;
}

export function TrackCard({ track, userRole, onUpdate }: TrackCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const canEdit = canUpdateTrack(userRole, track.department);
  const progressColor = getProgressColor(track.progress);
  const isComplete = track.progress === 100;

  const departmentLabels: Record<string, string> = {
    drafting: 'Drafting',
    purchasing: 'Purchasing',
    production: 'Produksi',
    qc: 'QC',
  };

  // Inline editing mode
  if (isEditing && canEdit) {
    return (
      <div className="py-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">{departmentLabels[track.department]}</span>
          <span className={cn('text-lg font-bold font-mono', track.progress === 100 ? 'text-emerald-600' : 'text-foreground')}>{track.progress}%</span>
        </div>
        <SmartProgressInput trackId={track.id} department={track.department} currentValue={track.progress} onClose={() => setIsEditing(false)} onUpdate={onUpdate} />
      </div>
    );
  }

  // Display mode - Click anywhere to edit
  return (
    <div 
      className={cn(
        'py-2 cursor-pointer transition-colors rounded-lg',
        canEdit ? 'hover:bg-muted active:bg-muted' : 'cursor-default'
      )} 
      onClick={() => canEdit && setIsEditing(true)}
    >
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-foreground">{departmentLabels[track.department]}</span>
        <span className={cn('text-xl font-bold font-mono', isComplete ? 'text-emerald-600' : 'text-foreground')}>{track.progress}%</span>
      </div>
      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', progressColor)} style={{ width: `${track.progress}%` }} />
      </div>
      {!canEdit && (
        <p className="text-xs text-muted-foreground mt-1 text-right">Hanya baca</p>
      )}
    </div>
  );
}
